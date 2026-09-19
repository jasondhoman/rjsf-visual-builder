import type { RegistryFieldsType, RegistryWidgetsType, WidgetProps, FieldProps } from '@rjsf/utils'

/**
 * A trivial custom string widget, purely to demonstrate that consumers can
 * pass their own RJSF widgets into `<RjsfFormBuilder>` and pick them from
 * the Inspector's Widget dropdown / see them rendered in the live preview.
 */
function ColorWidget(props: WidgetProps) {
  return (
    <input
      type="color"
      id={props.id}
      value={(props.value as string) ?? '#ffffff'}
      disabled={props.disabled}
      readOnly={props.readonly}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={(e) => props.onBlur?.(props.id, e.target.value)}
    />
  )
}

/** A trivial custom RJSF Field component, wrapping the default rendering in a labeled box. */
function HighlightedField(props: FieldProps) {
  const Registry = props.registry.fields.SchemaField
  return (
    <div style={{ border: '2px dashed orange', borderRadius: 6, padding: 8 }}>
      <Registry {...props} />
    </div>
  )
}

export const demoWidgets: RegistryWidgetsType = {
  color: ColorWidget,
}

export const demoFields: RegistryFieldsType = {
  highlighted: HighlightedField,
}
