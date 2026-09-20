import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from 'cn'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { paletteDefinitions } from '@/lib/visual/paletteItems'

/** The left-hand palette of draggable field-type buttons for the visual builder. */
export function Palette({
  isOpen,
  onOpenChange,
  order,
  panelId,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  order?: number
  panelId?: string
  onPanelDragStart?: (panelId: string) => void
  onPanelDrop?: (panelId: string) => void
}) {
  const draggable = useDraggable({ id: `panel:${panelId}`, data: { type: 'panel', panelId } })
  const droppable = useDroppable({ id: `panel-drop:${panelId}`, data: { type: 'panel-drop', panelId } })

  if (!isOpen) {
    return (
      <div
        data-rvb-panel-id={panelId}
        ref={droppable.setNodeRef}
        className={cn(
          'flex h-fit w-full items-center justify-start gap-1 rounded-md border bg-card px-2 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground',
          draggable.isDragging && 'opacity-50 ring-2 ring-primary',
          droppable.isOver && 'ring-2 ring-primary/50',
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
          aria-expanded={false}
          aria-label="Open field palette"
          onClick={() => onOpenChange(true)}
        >
          <ChevronRight className="size-4" />
          Palette
        </button>
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 hover:bg-accent"
          aria-label="Drag field palette"
          {...draggable.attributes}
          {...draggable.listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <aside
      data-rvb-panel-id={panelId}
      className={cn(
        'flex h-full min-h-0 flex-col gap-1 overflow-y-auto rounded-md border bg-card p-2 shadow-sm',
        draggable.isDragging && 'opacity-50 ring-2 ring-primary',
        droppable.isOver && 'ring-2 ring-primary/50',
      )}
      style={{ order }}
      ref={droppable.setNodeRef}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between rounded px-1 py-1 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-expanded
          aria-label="Close field palette"
          onClick={() => onOpenChange(false)}
          ref={draggable.setNodeRef}
        >
          <span>Palette</span>
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 hover:bg-accent"
          aria-label="Drag field palette"
          {...draggable.attributes}
          {...draggable.listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      {paletteDefinitions.map((definition) => (
        <PaletteButton key={definition.kind} definition={definition} />
      ))}
    </aside>
  )
}

function PaletteButton({ definition }: { definition: (typeof paletteDefinitions)[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${definition.kind}`,
    data: { type: 'palette', paletteKind: definition.kind },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        'flex flex-col gap-1.5 rounded-md border border-transparent p-2 text-left text-sm hover:border-border hover:bg-accent',
        isDragging && 'opacity-40',
      )}
      title={definition.hint}
      aria-label={`Drag ${definition.label} field`}
      {...attributes}
      {...listeners}
    >
      <span className="flex items-center gap-2 font-medium">
        <definition.icon className="size-4 shrink-0 text-muted-foreground" />
        {definition.label}
      </span>
      <PalettePreview kind={definition.kind} />
    </button>
  )
}

function PalettePreview({ kind }: { kind: (typeof paletteDefinitions)[number]['kind'] }) {
  if (kind === 'object' || kind === 'array' || kind === 'oneOf' || kind === 'anyOf') {
    const label = kind === 'object' ? 'Nested fields' : kind === 'array' ? 'Repeatable items' : 'Choice branches'
    return (
      <div className="rounded border border-dashed border-border/70 bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground">
        <span className="block h-1.5 w-2/3 rounded-sm bg-border/70" />
        <span className="mt-1 block">{label}</span>
      </div>
    )
  }

  if (kind === 'checkbox' || kind === 'multiselect') {
    const multiple = kind === 'multiselect'
    return (
      <div className="flex flex-col gap-1 rounded border border-border/70 bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
        {[multiple ? 'Option 1' : 'Enabled', ...(multiple ? ['Option 2'] : [])].map((label) => (
          <span key={label} className="flex items-center gap-1">
            <span className="size-2.5 rounded-[2px] border border-input bg-background" />
            {label}
          </span>
        ))}
      </div>
    )
  }

  if (kind === 'select') {
    return (
      <div className="flex h-6 items-center justify-between rounded border border-input bg-background px-2 text-[10px] text-muted-foreground">
        Option 1
        <span className="text-[8px]">v</span>
      </div>
    )
  }

  if (kind === 'textarea') {
    return (
      <div className="h-9 rounded border border-input bg-background px-2 py-1 text-[10px] text-muted-foreground">
        Enter text...
      </div>
    )
  }

  return (
    <div className="flex h-6 items-center rounded border border-input bg-background px-2 text-[10px] text-muted-foreground">
      {kind === 'date' || kind === 'datetime' ? 'mm/dd/yyyy' : kind === 'email' ? 'name@example.com' : 'Enter value...'}
    </div>
  )
}
