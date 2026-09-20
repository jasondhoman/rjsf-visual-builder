import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { RegistryFieldsType, RegistryWidgetsType, RJSFSchema, TemplatesType, UiSchema } from '@rjsf/utils'
import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from 'cn'
import { AlertCircle, Code2, Eye } from 'lucide-react'
import { schemaToTree, treeToSchema, treeToUiSchema } from './visual/convert'
import { paletteDefinitions, type PaletteKind } from './visual/paletteItems'
import { builderTreeReducer, getContainerNodes, type BuilderAction } from './visual/reducer'
import type { ContainerId } from './visual/types'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { FormPreviewPanel } from './components/FormPreviewPanel'
import { BuilderContext, type BuilderSelection } from './components/visual/builder-context'
import { CollapsiblePanel } from './components/visual/CollapsiblePanel'
import { Inspector } from './components/visual/Inspector'
import { NodeList } from './components/visual/NodeList'
import { Palette } from './components/visual/Palette'
import type { BuilderDocument } from './types'

export interface RjsfFormBuilderProps {
  /** Initial JSON Schema to load into the builder. */
  schema: RJSFSchema
  /** Initial RJSF uiSchema. Defaults to `{}`. */
  uiSchema?: UiSchema
  /** Initial sample form data shown in the live preview. */
  formData?: unknown
  /**
   * Called whenever the edited document changes, including changes to the
   * schema, uiSchema, or preview form data. The callback also runs once with
   * the initial document after the builder mounts.
   */
  onChange?: (document: BuilderDocument) => void
  /** Called when the live preview form is submitted. */
  onPreviewSubmit?: (formData: unknown) => void
  /** Called when the live preview form fails RJSF validation on submit. */
  onPreviewValidationError?: () => void
  /**
   * Custom RJSF widgets, keyed by the name referenced via `ui:widget`. Passed
   * straight through to the live preview's `<Form>`, and offered as extra
   * choices in the Inspector's widget picker for scalar fields.
   */
  widgets?: RegistryWidgetsType
  /**
   * Custom RJSF field components, keyed by the name referenced via
   * `ui:field`. Passed straight through to the live preview's `<Form>`, and
   * offered as extra choices in the Inspector's field-component picker.
   */
  fields?: RegistryFieldsType
  /** Custom RJSF templates (e.g. `FieldTemplate`, `ArrayFieldTemplate`), passed straight through to the live preview's `<Form>`. */
  templates?: Partial<TemplatesType>
  /**
   * Additional CSS classes applied to the builder's root element. Use this to
   * provide layout or host-application styling without replacing the builder's
   * built-in classes.
   */
  className?: string
  /**
   * Inline styles for the component's root element. Useful for overriding
   * the `--rvb-*` theme variables (colors, radius) for a single instance
   * without touching global CSS — e.g. `style={{ '--rvb-primary': '#2563eb' }}`.
   * For app-wide theming, override the same variables on `.rvb-root` in your
   * own stylesheet instead. See the README's Theming section.
   */
  style?: StyleWithCustomProperties
}

interface ActiveDrag {
  label: string
}

type BuilderView = 'visual' | 'code'
type VisualPanelId = 'palette' | 'canvas' | 'preview' | 'inspector'
type PanelWidths = Partial<Record<VisualPanelId, number>>
interface PanelResizeState {
  panel: VisualPanelId
  startX: number
  startWidth: number
}

function ResizeHandle({
  panel,
  order,
  onPointerDown,
}: {
  panel: VisualPanelId
  order: number
  onPointerDown: (panel: VisualPanelId, event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${panel} panel`}
      className="hidden cursor-col-resize rounded-sm bg-border/60 transition-colors hover:bg-primary lg:block"
      style={{ order }}
      onPointerDown={(event) => onPointerDown(panel, event)}
    />
  )
}

/** `CSSProperties` widened to also accept CSS custom properties (e.g. `--rvb-primary`) without a cast. */
type StyleWithCustomProperties = CSSProperties & { [key: `--${string}`]: string | number | undefined }

/**
 * A self-contained drag-and-drop visual builder for RJSF forms: a field-type
 * palette, a canvas of nested/sortable field cards, a live preview, and an
 * inspector for editing whichever field is selected.
 *
 * State (the schema/uiSchema/formData being edited) is managed internally,
 * seeded from the `schema`/`uiSchema`/`formData` props on first render only —
 * changing those props later does not reset the builder. To load a different
 * schema, remount the component with a different `key` prop.
 */
export function RjsfFormBuilder({
  schema,
  uiSchema,
  formData,
  onChange,
  onPreviewSubmit,
  onPreviewValidationError,
  widgets,
  fields,
  templates,
  className,
  style,
}: RjsfFormBuilderProps) {
  const [initialTree] = useState(() => schemaToTree(schema, uiSchema ?? {}))
  const [tree, rawDispatch] = useReducer(builderTreeReducer, initialTree)
  const [previewFormData, setPreviewFormData] = useState<unknown>(formData ?? {})
  const [selection, setSelection] = useState<BuilderSelection>(undefined)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(true)
  const [isCanvasOpen, setIsCanvasOpen] = useState(true)
  const [isPreviewOpen, setIsPreviewOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [panelOrder, setPanelOrder] = useState<VisualPanelId[]>(['palette', 'canvas', 'preview', 'inspector'])
  const [view, setView] = useState<BuilderView>('visual')
  const [codeText, setCodeText] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [panelWidths, setPanelWidths] = useState<PanelWidths>({})
  const [panelResize, setPanelResize] = useState<PanelResizeState | null>(null)
  const visualGridRef = useRef<HTMLDivElement>(null)
  const currentSchema = useMemo(() => treeToSchema(tree), [tree])
  const currentUiSchema = useMemo(() => treeToUiSchema(tree), [tree])
  const currentDocument = useMemo<BuilderDocument>(
    () => ({ schema: currentSchema, uiSchema: currentUiSchema, formData: previewFormData }),
    [currentSchema, currentUiSchema, previewFormData],
  )
  const widgetNames = useMemo(() => (widgets ? Object.keys(widgets) : []), [widgets])
  const fieldNames = useMemo(() => (fields ? Object.keys(fields) : []), [fields])
  const hasCollapsedVisualPanel = !isPaletteOpen || !isCanvasOpen || !isPreviewOpen || !isInspectorOpen
  const allVisualPanelsCollapsed = !isPaletteOpen && !isCanvasOpen && !isPreviewOpen && !isInspectorOpen
  const [draggingPanel, setDraggingPanel] = useState<VisualPanelId | null>(null)

  useEffect(() => {
    if (!panelResize) return

    const handlePointerMove = (event: PointerEvent) => {
      const panelElement = visualGridRef.current?.querySelector<HTMLElement>(
        `[data-rvb-panel-id="${panelResize.panel}"]`,
      )
      const gridElement = visualGridRef.current
      if (!panelElement || !gridElement) return

      const openPanelIds = panelOrder.filter(
        (panel) =>
          (panel === 'palette' && isPaletteOpen) ||
          (panel === 'canvas' && isCanvasOpen) ||
          (panel === 'preview' && isPreviewOpen) ||
          (panel === 'inspector' && isInspectorOpen),
      )
      const panelIndex = openPanelIds.indexOf(panelResize.panel)
      const panelsAfter = Math.max(0, openPanelIds.length - panelIndex - 1)
      const reservedWidth = panelsAfter * 180 + (panelsAfter + 1) * 8 + panelsAfter * 16
      const maxWidth = Math.max(
        180,
        gridElement.getBoundingClientRect().right - panelElement.getBoundingClientRect().left - reservedWidth,
      )
      const nextWidth = Math.min(maxWidth, Math.max(180, panelResize.startWidth + event.clientX - panelResize.startX))
      setPanelWidths((widths) => ({ ...widths, [panelResize.panel]: nextWidth }))
    }
    const handlePointerUp = () => setPanelResize(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [panelResize])

  const startPanelResize = (panel: VisualPanelId, event: ReactPointerEvent<HTMLDivElement>) => {
    const panelElement = visualGridRef.current?.querySelector<HTMLElement>(`[data-rvb-panel-id="${panel}"]`)
    setPanelResize({
      panel,
      startX: event.clientX,
      startWidth: panelElement?.getBoundingClientRect().width ?? (panel === 'palette' ? 220 : panel === 'inspector' ? 260 : 400),
    })
    event.preventDefault()
  }

  useEffect(() => {
    onChange?.(currentDocument)
  }, [currentDocument, onChange])
  const handlePanelDrop = (target: string) => {
    if (!draggingPanel || !target || draggingPanel === target) {
      setDraggingPanel(null)
      return
    }
    setPanelOrder((current) => {
      const next = current.filter((panel) => panel !== draggingPanel)
      const targetIndex = next.indexOf(target as VisualPanelId)
      next.splice(targetIndex, 0, draggingPanel)
      return next
    })
    setDraggingPanel(null)
  }
  const panelPosition = (panel: VisualPanelId) => panelOrder.indexOf(panel)
  const panelIsOpen = (panel: VisualPanelId) =>
    panel === 'palette' ? isPaletteOpen : panel === 'canvas' ? isCanvasOpen : panel === 'preview' ? isPreviewOpen : isInspectorOpen

  function dispatch(action: BuilderAction) {
    rawDispatch(action)
  }

  function handlePreviewFormDataChange(nextFormData: unknown) {
    setPreviewFormData(nextFormData)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type: string; paletteKind?: PaletteKind; panelId?: VisualPanelId } | undefined
    if (data?.type === 'panel') {
      setDraggingPanel(data.panelId as VisualPanelId)
      setActiveDrag({ label: `${data.panelId} panel` })
      return
    }
    if (data?.type === 'palette') {
      const def = paletteDefinitions.find((d) => d.kind === data.paletteKind)
      setActiveDrag(def ? { label: def.label } : null)
    } else {
      setActiveDrag({ label: 'Field' })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as
      | { type: 'palette'; paletteKind: PaletteKind }
      | { type: 'node'; containerId: ContainerId; nodeId: string }
      | { type: 'panel'; panelId: VisualPanelId }
      | undefined
    const overData = over.data.current as
      | { type: 'container'; containerId: ContainerId }
      | { type: 'node'; containerId: ContainerId; nodeId: string }
      | { type: 'panel-drop'; panelId: VisualPanelId }
      | undefined

    if (!activeData || !overData) return

    if (activeData.type === 'panel' && overData.type === 'panel-drop') {
      handlePanelDrop(overData.panelId)
      return
    }

    if (activeData.type === 'palette') {
      if (overData.type !== 'container' && overData.type !== 'node') return
      const def = paletteDefinitions.find((d) => d.kind === activeData.paletteKind)
      if (!def) return
      const containerId = overData.containerId
      const siblings = getContainerNodes(tree, containerId) ?? []
      const index = overData.type === 'node' ? siblings.findIndex((n) => n.id === overData.nodeId) : undefined
      const newNode = def.create()
      dispatch({ type: 'ADD_NODE', containerId, node: newNode, index: index === -1 ? undefined : index })
      setSelection({ kind: 'node', id: newNode.id })
      return
    }

    if (
      activeData.type === 'node' &&
      (overData.type === 'container' || overData.type === 'node') &&
      overData.containerId === activeData.containerId
    ) {
      const siblings = getContainerNodes(tree, activeData.containerId)
      if (!siblings) return
      const oldIndex = siblings.findIndex((n) => n.id === activeData.nodeId)
      const newIndex =
        overData.type === 'node' ? siblings.findIndex((n) => n.id === overData.nodeId) : siblings.length - 1
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        dispatch({ type: 'REORDER', containerId: activeData.containerId, oldIndex, newIndex })
      }
    }
  }

  function openCodeView() {
    setCodeText(JSON.stringify({ schema: currentSchema, uiSchema: currentUiSchema, formData: previewFormData }, null, 2))
    setCodeError(null)
    setView('code')
  }

  function applyCodeChanges() {
    try {
      const parsed: unknown = JSON.parse(codeText)
      if (!parsed || typeof parsed !== 'object' || !('schema' in parsed)) {
        throw new Error('Code must be a document object with a schema property.')
      }

      const document = parsed as Partial<BuilderDocument>
      if (!document.schema || typeof document.schema !== 'object') {
        throw new Error('The schema property must be a JSON Schema object.')
      }

      dispatch({ type: 'LOAD_TREE', tree: schemaToTree(document.schema, document.uiSchema ?? {}) })
      setPreviewFormData(document.formData ?? {})
      setCodeError(null)
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Could not parse the form document.')
    }
  }

  return (
    <BuilderContext.Provider value={{ dispatch, selection, select: setSelection }}>
      <div className={cn('rvb-root flex h-full min-h-0 flex-col gap-3', className)} style={style}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-md border bg-background p-1" aria-label="Builder view">
            <Button
              type="button"
              variant={view === 'visual' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('visual')}
              aria-pressed={view === 'visual'}
            >
              <Eye />
              Visual
            </Button>
            <Button
              type="button"
              variant={view === 'code' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={openCodeView}
              aria-pressed={view === 'code'}
            >
              <Code2 />
              Code
            </Button>
          </div>
        </div>
        {view === 'code' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-3 rounded-md border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Form document</p>
                  <p className="text-xs text-muted-foreground">
                    Edit JSON, then apply changes to update the rendered form.
                  </p>
                </div>
                <Button type="button" onClick={applyCodeChanges}>
                  Apply changes
                </Button>
              </div>
              <Textarea
                value={codeText}
                onChange={(event) => setCodeText(event.target.value)}
                className="min-h-0 flex-1 resize-none font-mono text-xs"
                aria-label="Form document JSON"
                spellCheck={false}
              />
              {codeError ? (
                <p className="flex items-center gap-1 text-sm text-destructive" role="alert">
                  <AlertCircle className="size-4" />
                  {codeError}
                </p>
              ) : null}
            </div>
            <FormPreviewPanel
              schema={currentSchema}
              uiSchema={currentUiSchema}
              formData={previewFormData}
              onFormDataChange={handlePreviewFormDataChange}
              onSubmit={onPreviewSubmit}
              onValidationError={onPreviewValidationError}
              widgets={widgets}
              fields={fields}
              templates={templates}
            />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDrag(null)}
          >
            <div
              ref={visualGridRef}
              className={cn(
                'grid h-full min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[var(--rvb-visual-columns)]',
              )}
              style={
                {
                  '--rvb-visual-columns': [
                    hasCollapsedVisualPanel ? '160px' : '0px',
                  ...panelOrder.filter(panelIsOpen).flatMap((panel) => [
                    panelWidths[panel]
                      ? `${panelWidths[panel]}px`
                      : panel === 'palette'
                        ? '220px'
                        : panel === 'inspector'
                          ? '260px'
                          : 'minmax(240px, 1fr)',
                    '8px',
                  ]),
                    allVisualPanelsCollapsed ? 'minmax(0, 1fr)' : null,
                  ]
                    .filter(Boolean)
                    .join(' '),
                } as CSSProperties
              }
            >
              <div className={cn('flex flex-col items-stretch gap-2', !hasCollapsedVisualPanel && 'hidden lg:flex')}>
                {panelOrder
                  .filter((panel) => !panelIsOpen(panel))
                  .map((panel) => {
                    if (panel === 'palette') {
                      return <Palette key={panel} isOpen={false} onOpenChange={setIsPaletteOpen} />
                    }
                    if (panel === 'canvas') {
                      return (
                        <CollapsiblePanel key={panel} title="Form Canvas" isOpen={false} onOpenChange={setIsCanvasOpen}>
                          <></>
                        </CollapsiblePanel>
                      )
                    }
                    if (panel === 'preview') {
                      return (
                        <CollapsiblePanel key={panel} title="Form Preview" isOpen={false} onOpenChange={setIsPreviewOpen}>
                          <></>
                        </CollapsiblePanel>
                      )
                    }
                    return (
                      <CollapsiblePanel key={panel} title="Inspector" isOpen={false} onOpenChange={setIsInspectorOpen}>
                        <></>
                      </CollapsiblePanel>
                    )
                  })}
              </div>
              {allVisualPanelsCollapsed ? (
                <div className="flex items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
                  Open a panel to get started
                </div>
              ) : null}
              {isPaletteOpen ? (
                <>
                  <Palette isOpen onOpenChange={setIsPaletteOpen} order={panelPosition('palette') * 2 + 1} panelId="palette" />
                  <ResizeHandle panel="palette" order={panelPosition('palette') * 2 + 2} onPointerDown={startPanelResize} />
                </>
              ) : null}
              {isCanvasOpen ? (
                <CollapsiblePanel
                  title="Form Canvas"
                  isOpen
                  onOpenChange={setIsCanvasOpen}
                  order={panelPosition('canvas') * 2 + 1}
                  panelId="canvas"
                  className="cursor-pointer"
                  onPanelDragStart={(panel) => setDraggingPanel((panel || null) as VisualPanelId | null)}
                  onPanelDrop={handlePanelDrop}
                >
                  <div className="h-full min-h-0 cursor-pointer overflow-y-auto rounded-md bg-muted/30 p-3">
                    <NodeList containerId="root" nodes={tree.children} emptyLabel="Drag fields here from the palette" />
                  </div>
                </CollapsiblePanel>
              ) : null}
              {isCanvasOpen ? (
                <ResizeHandle panel="canvas" order={panelPosition('canvas') * 2 + 2} onPointerDown={startPanelResize} />
              ) : null}
              {isPreviewOpen ? (
                <>
                  <FormPreviewPanel
                    schema={currentSchema}
                    uiSchema={currentUiSchema}
                    formData={previewFormData}
                    onFormDataChange={handlePreviewFormDataChange}
                    onSubmit={onPreviewSubmit}
                    onValidationError={onPreviewValidationError}
                    widgets={widgets}
                    fields={fields}
                    templates={templates}
                    isOpen
                    onOpenChange={setIsPreviewOpen}
                    order={panelPosition('preview') * 2 + 1}
                    panelId="preview"
                    onPanelDragStart={(panel) => setDraggingPanel((panel || null) as VisualPanelId | null)}
                  />
                  <ResizeHandle panel="preview" order={panelPosition('preview') * 2 + 2} onPointerDown={startPanelResize} />
                </>
              ) : null}
              {isInspectorOpen ? (
                <>
                  <Inspector
                    tree={tree}
                    availableWidgets={widgetNames}
                    availableFields={fieldNames}
                    isOpen
                    onOpenChange={setIsInspectorOpen}
                    order={panelPosition('inspector') * 2 + 1}
                    panelId="inspector"
                    onPanelDragStart={(panel) => setDraggingPanel((panel || null) as VisualPanelId | null)}
                  />
                  <ResizeHandle panel="inspector" order={panelPosition('inspector') * 2 + 2} onPointerDown={startPanelResize} />
                </>
              ) : null}
            </div>
            <DragOverlay>
              {activeDrag ? (
                <div className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-lg">{activeDrag.label}</div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </BuilderContext.Provider>
  )
}
