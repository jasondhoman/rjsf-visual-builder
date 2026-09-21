import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'cn'

interface CollapsiblePanelProps {
  title: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
  panelId?: string
  onPanelDragStart?: (panelId: string) => void
  onPanelDrop?: (panelId: string) => void
  order?: number
}

export function CollapsiblePanel({
  title,
  isOpen,
  onOpenChange,
  children,
  className,
  panelId,
  order,
}: CollapsiblePanelProps) {
  const draggable = useDraggable({
    id: `panel:${panelId}`,
    data: { type: 'panel', panelId },
  })
  const droppable = useDroppable({
    id: `panel-drop:${panelId}`,
    data: { type: 'panel-drop', panelId },
  })

  if (!isOpen) {
    return (
      <div
        data-rvb-panel-id={panelId}
        ref={droppable.setNodeRef}
        className={cn(
          'flex h-fit min-h-10 w-full items-center justify-start gap-1 rounded-md border bg-card px-2 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground',
          draggable.isDragging && 'opacity-50 ring-2 ring-primary',
          droppable.isOver && 'ring-2 ring-primary/50',
          className,
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left rvb-panel-title"
          aria-expanded={false}
          aria-label={`Open ${title.toLowerCase()}`}
          onClick={() => onOpenChange(true)}
        >
          <ChevronRight className="size-4 shrink-0" />
          <span className="whitespace-normal break-words">{title}</span>
        </button>
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 hover:bg-accent rvb-panel-drag-handle"
          aria-label={`Drag ${title.toLowerCase()}`}
          {...draggable.attributes}
          {...draggable.listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <section
      data-rvb-panel-id={panelId}
      className={cn(
        'flex min-h-0 flex-col rounded-md border bg-card',
        draggable.isDragging && 'opacity-50 ring-2 ring-primary',
        droppable.isOver && 'ring-2 ring-primary/50',
        className,
      )}
      style={{ order }}
      ref={droppable.setNodeRef}
    >
      <div className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between rounded px-1 py-1 text-left hover:bg-accent hover:text-foreground"
          aria-expanded
          onClick={() => onOpenChange(!isOpen)}
          ref={draggable.setNodeRef}
        >
          {title}
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 hover:bg-accent"
          aria-label={`Drag ${title.toLowerCase()}`}
          {...draggable.attributes}
          {...draggable.listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      {isOpen ? <div className="min-h-0 flex-1">{children}</div> : null}
    </section>
  )
}
