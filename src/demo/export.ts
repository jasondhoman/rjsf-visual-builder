import type { BuilderDocument } from './types'

function downloadTextFile(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadDocumentAsJson(doc: BuilderDocument): void {
  downloadTextFile(
    'rjsf-form.json',
    JSON.stringify(doc, null, 2),
    'application/json',
  )
}

/** Generates a standalone React/TSX snippet that renders the current document with RJSF. */
export function generateStandaloneComponent(doc: BuilderDocument): string {
  const schema = JSON.stringify(doc.schema, null, 2)
  const uiSchema = JSON.stringify(doc.uiSchema, null, 2)
  const formData = JSON.stringify(doc.formData, null, 2)

  return `import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'

const schema: RJSFSchema = ${schema}

const uiSchema: UiSchema = ${uiSchema}

const formData = ${formData}

export default function GeneratedForm() {
  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      validator={validator}
      onSubmit={({ formData }) => console.log('Submitted:', formData)}
    />
  )
}
`
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
