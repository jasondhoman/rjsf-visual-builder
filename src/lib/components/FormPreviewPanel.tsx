import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import type { RegistryFieldsType, RegistryWidgetsType, RJSFSchema, TemplatesType, UiSchema } from '@rjsf/utils'
import { Component, type ReactNode } from 'react'
import './rjsf-preview.css'
import { CollapsiblePanel } from './visual/CollapsiblePanel'

interface FormPreviewPanelProps {
  schema: RJSFSchema
  uiSchema: UiSchema
  formData: unknown
  onFormDataChange: (formData: unknown) => void
  /** Called when the previewed form is submitted. Show your own toast/notification here if desired. */
  onSubmit?: (formData: unknown) => void
  /** Called when the previewed form fails RJSF validation on submit. */
  onValidationError?: () => void
  /** Custom RJSF widgets, keyed by the name referenced via `ui:widget`. */
  widgets?: RegistryWidgetsType
  /** Custom RJSF field components, keyed by the name referenced via `ui:field`. */
  fields?: RegistryFieldsType
  /** Custom RJSF templates (e.g. `FieldTemplate`, `ArrayFieldTemplate`). */
  templates?: Partial<TemplatesType>
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  panelId?: string
  onPanelDragStart?: (panelId: string) => void
  onPanelDrop?: (panelId: string) => void
  order?: number
}

interface PreviewErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors thrown by RJSF (e.g. an invalid schema shape)
 * so a bad edit doesn't crash the whole builder.
 */
class PreviewErrorBoundary extends Component<{ children: ReactNode }, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Could not render the form preview.</p>
          <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Renders the current schema/uiSchema/formData with RJSF for live feedback.
 * Doesn't show any toasts or notifications itself — `onSubmit` and
 * `onValidationError` let the host application decide how to surface those.
 */
export function FormPreviewPanel({
  schema,
  uiSchema,
  formData,
  onFormDataChange,
  onSubmit,
  onValidationError,
  widgets,
  fields,
  templates,
  isOpen,
  onOpenChange,
  panelId,
  onPanelDragStart,
  onPanelDrop,
  order,
}: FormPreviewPanelProps) {
  const preview = (
    <div className="rjsf-preview h-full overflow-y-auto p-4">
      <PreviewErrorBoundary key={JSON.stringify(schema)}>
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          validator={validator}
          widgets={widgets}
          fields={fields}
          templates={templates}
          onChange={({ formData: next }) => onFormDataChange(next)}
          onSubmit={({ formData: submitted }) => onSubmit?.(submitted)}
          onError={() => onValidationError?.()}
        />
      </PreviewErrorBoundary>
    </div>
  )

  if (isOpen === undefined || !onOpenChange) {
    return <div className="h-full overflow-y-auto rounded-md border bg-card">{preview}</div>
  }

  return (
    <CollapsiblePanel
      title="Form Preview"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      panelId={panelId}
      onPanelDragStart={onPanelDragStart}
      onPanelDrop={onPanelDrop}
      order={order}
    >
      {preview}
    </CollapsiblePanel>
  )
}
