import type { RJSFSchema, UiSchema } from '@rjsf/utils'

/**
 * The full definition of a form that the builder edits: the JSON Schema,
 * the optional RJSF uiSchema, and any sample form data used for the preview.
 */
export interface BuilderDocument {
  schema: RJSFSchema
  uiSchema: UiSchema
  formData: unknown
}
