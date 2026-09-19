import type { BuilderTree, ConditionalBranch, ContainerId, FieldNode } from './types'

function makeId(): string {
  return crypto.randomUUID()
}

/** Generates a property key that doesn't collide with any sibling's existing key. */
export function uniqueKey(base: string, siblings: FieldNode[]): string {
  const existing = new Set(siblings.map((s) => s.key))
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}${i}`)) i += 1
  return `${base}${i}`
}

function isContainerNode(node: FieldNode): node is Extract<FieldNode, { kind: 'object' }> {
  return node.kind === 'object'
}

/**
 * Recursively applies `updateFn` to whichever container (list of sibling
 * nodes) matches `containerId`, treating an array's single item slot and a
 * oneOf/anyOf branch's children as containers too. Returns the same
 * reference if nothing changed, to avoid needless re-renders.
 */
function transformContainer(
  nodes: FieldNode[],
  containerId: ContainerId,
  updateFn: (children: FieldNode[]) => FieldNode[],
): FieldNode[] {
  let changed = false
  const next = nodes.map((node): FieldNode => {
    if (isContainerNode(node)) {
      if (containerId === `object:${node.id}`) {
        changed = true
        return { ...node, children: updateFn(node.children) }
      }
      const nestedChildren = transformContainer(node.children, containerId, updateFn)
      if (nestedChildren !== node.children) {
        changed = true
        return { ...node, children: nestedChildren }
      }
      return node
    }
    if (node.kind === 'array') {
      if (containerId === `arrayitem:${node.id}`) {
        changed = true
        const [replacement] = updateFn([node.itemNode])
        return { ...node, itemNode: replacement ?? node.itemNode }
      }
      const nestedItem = transformContainer([node.itemNode], containerId, updateFn)
      if (nestedItem[0] !== node.itemNode) {
        changed = true
        return { ...node, itemNode: nestedItem[0] }
      }
      return node
    }
    if (node.kind === 'oneOf' || node.kind === 'anyOf') {
      let branchChanged = false
      const nextBranches = node.branches.map((branch): ConditionalBranch => {
        if (containerId === `branch:${branch.id}`) {
          branchChanged = true
          return { ...branch, children: updateFn(branch.children) }
        }
        const nestedChildren = transformContainer(branch.children, containerId, updateFn)
        if (nestedChildren !== branch.children) {
          branchChanged = true
          return { ...branch, children: nestedChildren }
        }
        return branch
      })
      if (branchChanged) {
        changed = true
        return { ...node, branches: nextBranches }
      }
      return node
    }
    return node
  })
  return changed ? next : nodes
}

function applyToContainer(
  tree: BuilderTree,
  containerId: ContainerId,
  updateFn: (children: FieldNode[]) => FieldNode[],
): BuilderTree {
  if (containerId === 'root') {
    return { ...tree, children: updateFn(tree.children) }
  }
  return { ...tree, children: transformContainer(tree.children, containerId, updateFn) }
}

/** Recursively finds and replaces a node by id, wherever it lives in the tree. */
function transformNodeById(
  nodes: FieldNode[],
  nodeId: string,
  updateFn: (node: FieldNode) => FieldNode,
): FieldNode[] {
  let changed = false
  const next = nodes.map((node): FieldNode => {
    if (node.id === nodeId) {
      changed = true
      return updateFn(node)
    }
    if (isContainerNode(node)) {
      const nestedChildren = transformNodeById(node.children, nodeId, updateFn)
      if (nestedChildren !== node.children) {
        changed = true
        return { ...node, children: nestedChildren }
      }
      return node
    }
    if (node.kind === 'array') {
      const nestedItem = transformNodeById([node.itemNode], nodeId, updateFn)
      if (nestedItem[0] !== node.itemNode) {
        changed = true
        return { ...node, itemNode: nestedItem[0] }
      }
      return node
    }
    if (node.kind === 'oneOf' || node.kind === 'anyOf') {
      let branchChanged = false
      const nextBranches = node.branches.map((branch) => {
        const nestedChildren = transformNodeById(branch.children, nodeId, updateFn)
        if (nestedChildren !== branch.children) {
          branchChanged = true
          return { ...branch, children: nestedChildren }
        }
        return branch
      })
      if (branchChanged) {
        changed = true
        return { ...node, branches: nextBranches }
      }
      return node
    }
    return node
  })
  return changed ? next : nodes
}

export function findNodeById(nodes: FieldNode[], nodeId: string): FieldNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node
    if (isContainerNode(node)) {
      const found = findNodeById(node.children, nodeId)
      if (found) return found
    } else if (node.kind === 'array') {
      const found = findNodeById([node.itemNode], nodeId)
      if (found) return found
    } else if (node.kind === 'oneOf' || node.kind === 'anyOf') {
      for (const branch of node.branches) {
        const found = findNodeById(branch.children, nodeId)
        if (found) return found
      }
    }
  }
  return undefined
}

/** Returns the current sibling list for a container, used to compute drag-and-drop indices. */
export function getContainerNodes(tree: BuilderTree, containerId: ContainerId): FieldNode[] | undefined {
  if (containerId === 'root') return tree.children
  return searchContainer(tree.children, containerId)
}

function searchContainer(nodes: FieldNode[], containerId: ContainerId): FieldNode[] | undefined {
  for (const node of nodes) {
    if (isContainerNode(node)) {
      if (containerId === `object:${node.id}`) return node.children
      const found = searchContainer(node.children, containerId)
      if (found) return found
    } else if (node.kind === 'array') {
      if (containerId === `arrayitem:${node.id}`) return [node.itemNode]
      const found = searchContainer([node.itemNode], containerId)
      if (found) return found
    } else if (node.kind === 'oneOf' || node.kind === 'anyOf') {
      for (const branch of node.branches) {
        if (containerId === `branch:${branch.id}`) return branch.children
        const found = searchContainer(branch.children, containerId)
        if (found) return found
      }
    }
  }
  return undefined
}

export type BuilderAction =
  | { type: 'ADD_NODE'; containerId: ContainerId; node: FieldNode; index?: number }
  | { type: 'REPLACE_ITEM'; containerId: ContainerId; node: FieldNode }
  | { type: 'REORDER'; containerId: ContainerId; oldIndex: number; newIndex: number }
  | { type: 'DELETE_NODE'; containerId: ContainerId; nodeId: string }
  | { type: 'UPDATE_NODE'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'ADD_BRANCH'; nodeId: string }
  | { type: 'DELETE_BRANCH'; nodeId: string; branchId: string }
  | { type: 'UPDATE_BRANCH'; nodeId: string; branchId: string; patch: Partial<ConditionalBranch> }
  | { type: 'SET_ROOT_META'; title?: string; description?: string }
  | { type: 'LOAD_TREE'; tree: BuilderTree }

export function builderTreeReducer(tree: BuilderTree, action: BuilderAction): BuilderTree {
  switch (action.type) {
    case 'LOAD_TREE':
      return action.tree

    case 'SET_ROOT_META':
      return {
        ...tree,
        ...(action.title !== undefined ? { title: action.title } : {}),
        ...(action.description !== undefined ? { description: action.description } : {}),
      }

    case 'ADD_NODE':
      return applyToContainer(tree, action.containerId, (children) => {
        if (action.containerId.startsWith('arrayitem:')) return [action.node]
        const index = action.index ?? children.length
        const next = children.slice()
        next.splice(index, 0, action.node)
        return next
      })

    case 'REPLACE_ITEM':
      return applyToContainer(tree, action.containerId, () => [action.node])

    case 'REORDER':
      return applyToContainer(tree, action.containerId, (children) => {
        const next = children.slice()
        const [moved] = next.splice(action.oldIndex, 1)
        next.splice(action.newIndex, 0, moved)
        return next
      })

    case 'DELETE_NODE':
      return applyToContainer(tree, action.containerId, (children) =>
        children.filter((c) => c.id !== action.nodeId),
      )

    case 'UPDATE_NODE':
      return { ...tree, children: transformNodeById(tree.children, action.nodeId, (node) => ({ ...node, ...action.patch }) as FieldNode) }

    case 'ADD_BRANCH':
      return {
        ...tree,
        children: transformNodeById(tree.children, action.nodeId, (node) => {
          if (node.kind !== 'oneOf' && node.kind !== 'anyOf') return node
          const branch: ConditionalBranch = {
            id: makeId(),
            title: `Option ${node.branches.length + 1}`,
            children: [],
          }
          return { ...node, branches: [...node.branches, branch] }
        }),
      }

    case 'DELETE_BRANCH':
      return {
        ...tree,
        children: transformNodeById(tree.children, action.nodeId, (node) => {
          if (node.kind !== 'oneOf' && node.kind !== 'anyOf') return node
          return { ...node, branches: node.branches.filter((b) => b.id !== action.branchId) }
        }),
      }

    case 'UPDATE_BRANCH':
      return {
        ...tree,
        children: transformNodeById(tree.children, action.nodeId, (node) => {
          if (node.kind !== 'oneOf' && node.kind !== 'anyOf') return node
          return {
            ...node,
            branches: node.branches.map((b) => (b.id === action.branchId ? { ...b, ...action.patch } : b)),
          }
        }),
      }

    default:
      return tree
  }
}

export { makeId }
