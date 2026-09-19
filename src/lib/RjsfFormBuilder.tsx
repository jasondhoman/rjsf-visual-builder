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
import { useMemo, useReducer, useState, type CSSProperties } from 'react'
import { cn } from 'cn'
import { Loader2, Save } from 'lucide-react'
import { schemaToTree, treeToSchema, treeToUiSchema } from './visual/convert'
import { paletteDefinitions, type PaletteKind } from './visual/paletteItems'
import { builderTreeReducer, getContainerNodes } from './visual/reducer'
import type { ContainerId } from './visual/types'
import type { BuilderDocument } from './types'
import { Button } from './ui/button'
import { FormPreviewPanel } from './components/FormPreviewPanel'
import { BuilderContext, type BuilderSelection } from './components/visual/builder-context'
import { Inspector } from './components/visual/Inspector'
import { NodeList } from './components/visual/NodeList'
import { Palette } from './components/visual/Palette'

export interface RjsfFormBuilderProps {
  /** Initial JSON Schema to load into the builder. */
  schema: RJSFSchema
  /** Initial RJSF uiSchema. Defaults to `{}`. */
  uiSchema?: UiSchema
  /** Initial sample form data shown in the live preview. */
  formData?: unknown
  /**
   * Called with the current document when the user clicks Save. May return
   * a promise; the Save button is disabled while it's pending. This library
   * never shows toasts/notifications itself — show your own based on the
   * result (or thrown error) of this callback.
   */
  onSave: (document: BuilderDocument) => void | Promise<void>
  /** Label for the save button. Defaults to `"Save"`. */
  saveLabel?: string
  /** Called when the live preview form is submitted (separate from Save). */
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
  onSave,
  saveLabel = 'Save',
  onPreviewSubmit,
  onPreviewValidationError,
  widgets,
  fields,
  templates,
  className,
  style,
}: RjsfFormBuilderProps) {
  const [tree, dispatch] = useReducer(builderTreeReducer, undefined, () =>
    schemaToTree(schema, uiSchema ?? {}),
  )
  const [previewFormData, setPreviewFormData] = useState<unknown>(formData ?? {})
  const [selection, setSelection] = useState<BuilderSelection>(undefined)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentSchema = useMemo(() => treeToSchema(tree), [tree])
  const currentUiSchema = useMemo(() => treeToUiSchema(tree), [tree])
  const widgetNames = useMemo(() => (widgets ? Object.keys(widgets) : []), [widgets])
  const fieldNames = useMemo(() => (fields ? Object.keys(fields) : []), [fields])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type: string; paletteKind?: PaletteKind } | undefined
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
      | undefined
    const overData = over.data.current as
      | { type: 'container'; containerId: ContainerId }
      | { type: 'node'; containerId: ContainerId; nodeId: string }
      | undefined

    if (!activeData || !overData) return

    if (activeData.type === 'palette') {
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

    if (activeData.type === 'node' && overData.containerId === activeData.containerId) {
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

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({ schema: currentSchema, uiSchema: currentUiSchema, formData: previewFormData })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BuilderContext.Provider value={{ dispatch, selection, select: setSelection }}>
      <div className={cn('rvb-root flex h-full min-h-0 flex-col gap-3', className)} style={style}>
        <div className="flex items-center justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {saveLabel}
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[200px_1fr_1fr_260px]">
            <Palette />
            <div className="min-h-0 overflow-y-auto rounded-md border bg-muted/30 p-3">
              <NodeList containerId="root" nodes={tree.children} emptyLabel="Drag fields here from the palette" />
            </div>
            <FormPreviewPanel
              schema={currentSchema}
              uiSchema={currentUiSchema}
              formData={previewFormData}
              onFormDataChange={setPreviewFormData}
              onSubmit={onPreviewSubmit}
              onValidationError={onPreviewValidationError}
              widgets={widgets}
              fields={fields}
              templates={templates}
            />
            <Inspector tree={tree} availableWidgets={widgetNames} availableFields={fieldNames} />
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-lg">{activeDrag.label}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </BuilderContext.Provider>
  )
}
