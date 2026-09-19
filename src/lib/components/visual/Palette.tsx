import { useDraggable } from '@dnd-kit/core'
import { cn } from 'cn'
import { paletteDefinitions } from '@/lib/visual/paletteItems'

/** The left-hand palette of draggable field-type buttons for the visual builder. */
export function Palette() {
  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto rounded-md border bg-card p-2">
      <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Drag a field onto the canvas</p>
      {paletteDefinitions.map((definition) => (
        <PaletteButton key={definition.kind} definition={definition} />
      ))}
    </div>
  )
}

function PaletteButton({ definition }: { definition: (typeof paletteDefinitions)[number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${definition.kind}`,
    data: { type: 'palette', paletteKind: definition.kind },
  })
  const Icon = definition.icon

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        'flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-accent',
        isDragging && 'opacity-40',
      )}
      title={definition.hint}
      {...attributes}
      {...listeners}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span>{definition.label}</span>
    </button>
  )
}
