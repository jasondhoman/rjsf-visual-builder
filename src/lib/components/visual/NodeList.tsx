import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from 'cn'
import type { ContainerId, FieldNode } from '@/lib/visual/types'
import { NodeCard } from './NodeCard'

interface NodeListProps {
  containerId: ContainerId
  nodes: FieldNode[]
  emptyLabel: string
  compact?: boolean
  fill?: boolean
}

/**
 * A droppable + sortable list of sibling fields. Used for the root canvas, an
 * object's properties, an array's single item slot, and a oneOf/anyOf
 * branch's properties — every "container" in the tree renders through this
 * same component.
 */
export function NodeList({ containerId, nodes, emptyLabel, compact, fill }: NodeListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: 'container', containerId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-16 flex-col gap-2 rounded-md border border-dashed p-2 transition-colors',
        isOver && 'border-primary bg-primary/5',
        compact && 'min-h-10',
        fill && 'flex-1',
      )}
    >
      {nodes.length === 0 ? (
        <p className="p-2 text-center text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} containerId={containerId} />
          ))}
        </SortableContext>
      )}
    </div>
  )
}
