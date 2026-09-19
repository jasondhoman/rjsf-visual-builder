import type { RJSFSchema, UiSchema } from '@rjsf/utils'
import type {
  BuilderTree,
  ConditionalBranch,
  FieldNode,
  PrimitiveType,
} from './types'

function makeId(): string {
  return crypto.randomUUID()
}

const ROOT_SCHEMA_KEYS = new Set(['type', 'title', 'description', 'properties', 'required'])

/** Converts a JSON Schema + uiSchema pair into the visual builder's editable tree. */
export function schemaToTree(schema: RJSFSchema, uiSchema: UiSchema): BuilderTree {
  const extraRootKeywords: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(schema)) {
    if (!ROOT_SCHEMA_KEYS.has(key)) extraRootKeywords[key] = value
  }

  const properties = (schema.properties ?? {}) as Record<string, RJSFSchema>
  const required = new Set(schema.required ?? [])

  const children = Object.entries(properties).map(([key, propSchema]) =>
    schemaPropToNode(key, propSchema, required.has(key), (uiSchema as Record<string, unknown>)[key] as UiSchema),
  )

  return {
    title: schema.title,
    description: schema.description,
    children,
    extraRootKeywords,
  }
}

function schemaPropToNode(
  key: string,
  propSchema: RJSFSchema,
  required: boolean,
  uiSchema: UiSchema | undefined,
): FieldNode {
  const uiField = (uiSchema as Record<string, unknown>)?.['ui:field'] as string | undefined
  const base = {
    id: makeId(),
    key,
    title: propSchema.title ?? key,
    description: propSchema.description,
    required,
    uiField,
  }

  const branchesSource = propSchema.oneOf ?? propSchema.anyOf
  if (Array.isArray(branchesSource)) {
    const branches: ConditionalBranch[] = branchesSource.map((branch, index) => {
      const branchSchema = branch as RJSFSchema
      const branchProps = (branchSchema.properties ?? {}) as Record<string, RJSFSchema>
      const branchRequired = new Set(branchSchema.required ?? [])
      return {
        id: makeId(),
        title: branchSchema.title ?? `Option ${index + 1}`,
        children: Object.entries(branchProps).map(([k, v]) =>
          schemaPropToNode(k, v, branchRequired.has(k), undefined),
        ),
      }
    })
    return { ...base, kind: propSchema.oneOf ? 'oneOf' : 'anyOf', branches }
  }

  if (propSchema.type === 'object') {
    const nestedProps = (propSchema.properties ?? {}) as Record<string, RJSFSchema>
    const nestedRequired = new Set(propSchema.required ?? [])
    return {
      ...base,
      kind: 'object',
      children: Object.entries(nestedProps).map(([k, v]) =>
        schemaPropToNode(k, v, nestedRequired.has(k), (uiSchema as Record<string, unknown>)?.[k] as UiSchema),
      ),
    }
  }

  if (propSchema.type === 'array') {
    const items = propSchema.items as RJSFSchema | undefined
    if (
      items &&
      items.type === 'string' &&
      Array.isArray(items.enum) &&
      propSchema.uniqueItems
    ) {
      return {
        ...base,
        kind: 'multiselect',
        enumOptions: items.enum as string[],
      }
    }
    const itemUiSchema = (uiSchema as Record<string, unknown>)?.items as UiSchema | undefined
    const itemNode = items
      ? schemaPropToNode('item', items, false, itemUiSchema)
      : ({ ...base, id: makeId(), key: 'item', kind: 'field', fieldType: 'string' } as FieldNode)
    return {
      ...base,
      kind: 'array',
      itemNode,
      minItems: propSchema.minItems,
      maxItems: propSchema.maxItems,
      uniqueItems: propSchema.uniqueItems,
    }
  }

  if (
    propSchema.type === 'string' ||
    propSchema.type === 'number' ||
    propSchema.type === 'integer' ||
    propSchema.type === 'boolean'
  ) {
    const widget = (uiSchema as Record<string, unknown>)?.['ui:widget'] as string | undefined
    return {
      ...base,
      kind: 'field',
      fieldType: propSchema.type as PrimitiveType,
      widget,
      format: propSchema.format as 'date' | 'date-time' | 'email' | 'uri' | undefined,
      enumOptions: Array.isArray(propSchema.enum) ? (propSchema.enum as string[]) : undefined,
      default: propSchema.default,
      minLength: propSchema.minLength,
      maxLength: propSchema.maxLength,
      pattern: propSchema.pattern,
      minimum: propSchema.minimum,
      maximum: propSchema.maximum,
    }
  }

  return { ...base, kind: 'raw', schema: propSchema }
}

/** Converts the visual builder's tree back into a JSON Schema. */
export function treeToSchema(tree: BuilderTree): RJSFSchema {
  const properties: Record<string, RJSFSchema> = {}
  const required: string[] = []

  for (const child of tree.children) {
    properties[child.key] = nodeToSchema(child)
    if (child.required) required.push(child.key)
  }

  return {
    type: 'object',
    ...(tree.title ? { title: tree.title } : {}),
    ...(tree.description ? { description: tree.description } : {}),
    ...(tree.extraRootKeywords ?? {}),
    properties,
    ...(required.length ? { required } : {}),
  }
}

function nodeToSchema(node: FieldNode): RJSFSchema {
  const common: RJSFSchema = { title: node.title }
  if (node.description) common.description = node.description

  switch (node.kind) {
    case 'field': {
      const schema: RJSFSchema = { ...common, type: node.fieldType }
      if (node.format) schema.format = node.format
      if (node.enumOptions?.length) schema.enum = node.enumOptions
      if (node.default !== undefined) schema.default = node.default as RJSFSchema['default']
      if (node.minLength !== undefined) schema.minLength = node.minLength
      if (node.maxLength !== undefined) schema.maxLength = node.maxLength
      if (node.pattern) schema.pattern = node.pattern
      if (node.minimum !== undefined) schema.minimum = node.minimum
      if (node.maximum !== undefined) schema.maximum = node.maximum
      return schema
    }
    case 'multiselect':
      return {
        ...common,
        type: 'array',
        items: { type: 'string', enum: node.enumOptions },
        uniqueItems: true,
      }
    case 'object': {
      const properties: Record<string, RJSFSchema> = {}
      const required: string[] = []
      for (const child of node.children) {
        properties[child.key] = nodeToSchema(child)
        if (child.required) required.push(child.key)
      }
      return {
        ...common,
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      }
    }
    case 'array': {
      const schema: RJSFSchema = { ...common, type: 'array', items: nodeToSchema(node.itemNode) }
      if (node.minItems !== undefined) schema.minItems = node.minItems
      if (node.maxItems !== undefined) schema.maxItems = node.maxItems
      if (node.uniqueItems) schema.uniqueItems = true
      return schema
    }
    case 'oneOf':
    case 'anyOf': {
      const branchSchemas = node.branches.map((branch) => {
        const properties: Record<string, RJSFSchema> = {}
        const required: string[] = []
        for (const child of branch.children) {
          properties[child.key] = nodeToSchema(child)
          if (child.required) required.push(child.key)
        }
        return {
          title: branch.title,
          type: 'object' as const,
          properties,
          ...(required.length ? { required } : {}),
        }
      })
      return { ...common, [node.kind]: branchSchemas }
    }
    case 'raw':
      return node.schema as RJSFSchema
  }
}

/** Converts the visual builder's tree into a matching (best-effort) uiSchema. */
export function treeToUiSchema(tree: BuilderTree): UiSchema {
  const ui: UiSchema = {}
  for (const child of tree.children) {
    const entry = nodeToUiSchema(child)
    if (entry && Object.keys(entry).length) ui[child.key] = entry
  }
  return ui
}

function nodeToUiSchema(node: FieldNode): UiSchema | undefined {
  const entry: UiSchema = {}

  switch (node.kind) {
    case 'field':
      if (node.widget) entry['ui:widget'] = node.widget
      break
    case 'multiselect':
      entry['ui:widget'] = 'checkboxes'
      break
    case 'object': {
      const nested: UiSchema = {}
      for (const child of node.children) {
        const childEntry = nodeToUiSchema(child)
        if (childEntry && Object.keys(childEntry).length) nested[child.key] = childEntry
      }
      Object.assign(entry, nested)
      break
    }
    case 'array': {
      const itemsEntry = nodeToUiSchema(node.itemNode)
      if (itemsEntry) entry.items = itemsEntry
      break
    }
    default:
      break
  }

  if (node.uiField) entry['ui:field'] = node.uiField

  return Object.keys(entry).length ? entry : undefined
}
