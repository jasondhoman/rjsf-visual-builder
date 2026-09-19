/**
 * The visual builder's own tree representation of a form. It mirrors JSON
 * Schema + uiSchema concepts but is shaped for editing: every field has a
 * stable `id` (for drag-and-drop and selection) separate from its schema
 * property `key`, and container relationships (object properties, array
 * items, oneOf/anyOf branches) are modeled explicitly instead of as raw
 * schema keywords.
 */

export type PrimitiveType = 'string' | 'number' | 'integer' | 'boolean'

/** Widget names built into the visual builder; any other string is treated as a custom widget name. */
export type StringWidget = 'text' | 'textarea' | 'password'
export type StringFormat = 'date' | 'date-time' | 'email' | 'uri'

interface BaseNode {
  id: string
  key: string
  title: string
  description?: string
  required: boolean
  /**
   * Overrides the RJSF Field component used to render this property (`ui:field`).
   * Must match a key in the `fields` registry passed to `RjsfFormBuilder`.
   */
  uiField?: string
}

/** A single scalar field: string, number, integer, boolean, or a string enum (select). */
export interface PrimitiveFieldNode extends BaseNode {
  kind: 'field'
  fieldType: PrimitiveType
  /** A built-in widget name, or the name of a custom widget from the `widgets` registry passed to `RjsfFormBuilder`. */
  widget?: string
  format?: StringFormat
  enumOptions?: string[]
  default?: unknown
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
}

/** Sugar for an array of unique string enum values, rendered as a checkbox group. */
export interface MultiSelectFieldNode extends BaseNode {
  kind: 'multiselect'
  enumOptions: string[]
}

/** A nested object with its own ordered list of child fields. */
export interface ObjectFieldNode extends BaseNode {
  kind: 'object'
  children: FieldNode[]
}

/** A homogeneous array whose single item schema is itself a field node. */
export interface ArrayFieldNode extends BaseNode {
  kind: 'array'
  itemNode: FieldNode
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export interface ConditionalBranch {
  id: string
  title: string
  children: FieldNode[]
}

/** A property whose value must match exactly one (oneOf) or at least one (anyOf) branch schema. */
export interface ConditionalFieldNode extends BaseNode {
  kind: 'oneOf' | 'anyOf'
  branches: ConditionalBranch[]
}

/** A property whose schema shape isn't recognized by the visual builder; preserved verbatim. */
export interface RawFieldNode extends BaseNode {
  kind: 'raw'
  schema: unknown
}

export type FieldNode =
  | PrimitiveFieldNode
  | MultiSelectFieldNode
  | ObjectFieldNode
  | ArrayFieldNode
  | ConditionalFieldNode
  | RawFieldNode

export interface BuilderTree {
  title?: string
  description?: string
  children: FieldNode[]
  /** Root-level schema keywords the visual builder doesn't understand (e.g. `dependencies`), kept intact. */
  extraRootKeywords?: Record<string, unknown>
}

export type ContainerId = 'root' | `object:${string}` | `arrayitem:${string}` | `branch:${string}`

export function objectContainerId(nodeId: string): ContainerId {
  return `object:${nodeId}`
}
export function arrayItemContainerId(nodeId: string): ContainerId {
  return `arrayitem:${nodeId}`
}
export function branchContainerId(branchId: string): ContainerId {
  return `branch:${branchId}`
}
