import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from 'cn'
import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  FolderTree,
  GitBranch,
  Grip,
  Hash,
  ListChecks,
  ListOrdered,
  Mail,
  Plus,
  SquareStack,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { MouseEvent } from 'react'
import { Badge } from '@/lib/ui/badge'
import {
  arrayItemContainerId,
  branchContainerId,
  objectContainerId,
  type ContainerId,
  type FieldNode,
} from '@/lib/visual/types'
import { useBuilderContext } from './builder-context'
import { NodeList } from './NodeList'

function nodeIcon(node: FieldNode): LucideIcon {
  switch (node.kind) {
    case 'field':
      if (node.enumOptions?.length) return ListChecks
      if (node.format === 'date') return Calendar
      if (node.format === 'date-time') return CalendarClock
      if (node.format === 'email') return Mail
      if (node.widget === 'textarea') return AlignLeft
      if (node.fieldType === 'boolean') return CheckSquare
      if (node.fieldType === 'number' || node.fieldType === 'integer') return Hash
      return Type
    case 'multiselect':
      return SquareStack
    case 'object':
      return FolderTree
    case 'array':
      return ListOrdered
    case 'oneOf':
    case 'anyOf':
      return GitBranch
    case 'raw':
      return Type
  }
}

function kindLabel(node: FieldNode): string {
  switch (node.kind) {
    case 'field':
      return node.enumOptions?.length ? 'select' : node.format ? `${node.fieldType} · ${node.format}` : node.fieldType
    case 'multiselect':
      return 'multi-select'
    case 'object':
      return 'group'
    case 'array':
      return 'list'
    case 'oneOf':
      return 'oneOf'
    case 'anyOf':
      return 'anyOf'
    case 'raw':
      return 'unsupported'
  }
}

interface NodeCardProps {
  node: FieldNode
  containerId: ContainerId
  isArrayItem?: boolean
}

export function NodeCard({ node, containerId, isArrayItem }: NodeCardProps) {
  const { dispatch, selection, select } = useBuilderContext()
  const sortable = useSortable({
    id: node.id,
    data: { type: 'node', containerId, nodeId: node.id },
    disabled: isArrayItem,
  })
  const isSelected = selection?.kind === 'node' && selection.id === node.id
  const Icon = nodeIcon(node)

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  function handleSelect(e: MouseEvent) {
    e.stopPropagation()
    select({ kind: 'node', id: node.id })
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation()
    dispatch({ type: 'DELETE_NODE', containerId, nodeId: node.id })
    if (isSelected) select(undefined)
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      onClick={handleSelect}
      className={cn(
        'rounded-md border bg-background p-2 shadow-sm',
        isSelected && 'ring-2 ring-primary',
        sortable.isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-2">
        {!isArrayItem && (
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <Grip className="size-4" />
          </button>
        )}
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-medium">{node.title || node.key}</span>
        {node.required && (
          <Badge variant="secondary" className="text-[10px]">
            required
          </Badge>
        )}
        <span className="text-[10px] whitespace-nowrap text-muted-foreground">{kindLabel(node)}</span>
        {!isArrayItem && (
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            aria-label={`Delete ${node.title}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {node.kind === 'object' && (
        <div className="mt-2 pl-4">
          <NodeList containerId={objectContainerId(node.id)} nodes={node.children} emptyLabel="Drop fields here" />
        </div>
      )}

      {node.kind === 'array' && (
        <div className="mt-2 pl-4">
          <NodeList
            containerId={arrayItemContainerId(node.id)}
            nodes={[node.itemNode]}
            emptyLabel="Drop a field type here to define the item shape"
            compact
          />
        </div>
      )}

      {(node.kind === 'oneOf' || node.kind === 'anyOf') && (
        <div className="mt-2 flex flex-col gap-2 pl-4">
          {node.branches.map((branch) => {
            const isBranchSelected = selection?.kind === 'branch' && selection.branchId === branch.id
            return (
              <div
                key={branch.id}
                className={cn('rounded-md border p-2', isBranchSelected && 'ring-2 ring-primary')}
                onClick={(e) => {
                  e.stopPropagation()
                  select({ kind: 'branch', nodeId: node.id, branchId: branch.id })
                }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium">{branch.title}</span>
                  {node.branches.length > 1 && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'DELETE_BRANCH', nodeId: node.id, branchId: branch.id })
                      }}
                      aria-label={`Delete ${branch.title}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <NodeList containerId={branchContainerId(branch.id)} nodes={branch.children} emptyLabel="Drop fields here" compact />
              </div>
            )
          })}
          <button
            type="button"
            className="flex items-center gap-1 self-start text-xs text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              dispatch({ type: 'ADD_BRANCH', nodeId: node.id })
            }}
          >
            <Plus className="size-3.5" /> Add option
          </button>
        </div>
      )}

      {node.kind === 'raw' && (
        <p className="mt-2 pl-6 text-xs text-muted-foreground">
          This field's schema isn't supported by the visual builder and is preserved as-is. Edit it in Code mode.
        </p>
      )}
    </div>
  )
}
