import { Button } from '@/lib/ui/button'
import { Checkbox } from '@/lib/ui/checkbox'
import { Input } from '@/lib/ui/input'
import { Label } from '@/lib/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/select'
import { Textarea } from '@/lib/ui/textarea'
import { findNodeById } from '@/lib/visual/reducer'
import type { BuilderTree } from '@/lib/visual/types'
import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useBuilderContext } from './builder-context'
import { EnumEditor } from './EnumEditor'

interface InspectorProps {
  tree: BuilderTree
  /** Names of custom RJSF widgets passed to `RjsfFormBuilder`, offered as extra options in the Widget picker. */
  availableWidgets?: string[]
  /** Names of custom RJSF field components passed to `RjsfFormBuilder`, offered in the Field component picker. */
  availableFields?: string[]
}

/**
 * The right-hand panel: shows editable properties for whatever is currently
 * selected in the canvas (a field, or a oneOf/anyOf branch).
 */
export function Inspector({ tree, availableWidgets = [], availableFields = [] }: InspectorProps) {
  const { selection, dispatch, select } = useBuilderContext()

  if (!selection) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        Select a field on the canvas to edit its properties.
      </div>
    )
  }

  if (selection.kind === 'branch') {
    const node = findNodeById(tree.children, selection.nodeId)
    if (!node || (node.kind !== 'oneOf' && node.kind !== 'anyOf')) return null
    const branch = node.branches.find((b) => b.id === selection.branchId)
    if (!branch) return null

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-md border bg-card p-3">
        <p className="text-xs font-medium text-muted-foreground">Conditional option</p>
        <Field label="Option title">
          <Input
            value={branch.title}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_BRANCH', nodeId: node.id, branchId: branch.id, patch: { title: e.target.value } })
            }
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Drag fields from the palette into this option's box on the canvas to define what it contains.
        </p>
      </div>
    )
  }

  const node = findNodeById(tree.children, selection.id)
  if (!node) return null

  function patch(values: Record<string, unknown>) {
    dispatch({ type: 'UPDATE_NODE', nodeId: node!.id, patch: values })
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-md border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Field properties</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-destructive hover:text-destructive"
          onClick={() => select(undefined)}
        >
          Done
        </Button>
      </div>

      <Field label="Property name">
        <Input value={node.key} onChange={(e) => patch({ key: e.target.value })} />
      </Field>

      <Field label="Title">
        <Input value={node.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>

      <Field label="Description">
        <Textarea
          value={node.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          rows={2}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={node.required} onCheckedChange={(checked) => patch({ required: checked === true })} />
        Required
      </label>

      {availableFields.length > 0 && (
        <Field label="Field component">
          <Select
            value={node.uiField ?? 'default'}
            onValueChange={(value) => patch({ uiField: value === 'default' ? undefined : value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {availableFields.map((name) => (
                <SelectItem key={name} value={name}>
                  {name} (custom)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {node.kind === 'field' && (
        <>
          {node.fieldType === 'string' && (
            <>
              <Field label="Widget">
                <Select
                  value={node.enumOptions ? 'select' : (node.widget ?? 'text')}
                  onValueChange={(value) => {
                    if (value === 'select') {
                      patch({ enumOptions: node.enumOptions ?? ['Option 1', 'Option 2'], widget: undefined, format: undefined })
                    } else {
                      patch({ widget: value === 'text' ? undefined : value, enumOptions: undefined })
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="select">Select (enum)</SelectItem>
                    {availableWidgets
                      .filter((name) => !['text', 'textarea', 'password'].includes(name))
                      .map((name) => (
                        <SelectItem key={name} value={name}>
                          {name} (custom)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              {node.enumOptions ? (
                <Field label="Options">
                  <EnumEditor options={node.enumOptions} onChange={(enumOptions) => patch({ enumOptions })} />
                </Field>
              ) : (
                <Field label="Format">
                  <Select
                    value={node.format ?? 'none'}
                    onValueChange={(value) => patch({ format: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="date-time">Date &amp; time</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="uri">URL</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Min length">
                  <Input
                    type="number"
                    value={node.minLength ?? ''}
                    onChange={(e) => patch({ minLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </Field>
                <Field label="Max length">
                  <Input
                    type="number"
                    value={node.maxLength ?? ''}
                    onChange={(e) => patch({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Pattern (regex)">
                <Input value={node.pattern ?? ''} onChange={(e) => patch({ pattern: e.target.value || undefined })} />
              </Field>
              <Field label="Default value">
                <Input
                  value={(node.default as string) ?? ''}
                  onChange={(e) => patch({ default: e.target.value || undefined })}
                />
              </Field>
            </>
          )}

          {(node.fieldType === 'number' || node.fieldType === 'integer') && (
            <>
              {availableWidgets.length > 0 && (
                <Field label="Widget">
                  <Select
                    value={node.widget ?? 'default'}
                    onValueChange={(value) => patch({ widget: value === 'default' ? undefined : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      {availableWidgets.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name} (custom)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Minimum">
                  <Input
                    type="number"
                    value={node.minimum ?? ''}
                    onChange={(e) => patch({ minimum: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </Field>
                <Field label="Maximum">
                  <Input
                    type="number"
                    value={node.maximum ?? ''}
                    onChange={(e) => patch({ maximum: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Default value">
                <Input
                  type="number"
                  value={(node.default as number) ?? ''}
                  onChange={(e) => patch({ default: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </Field>
            </>
          )}

          {node.fieldType === 'boolean' && (
            <>
              {availableWidgets.length > 0 && (
                <Field label="Widget">
                  <Select
                    value={node.widget ?? 'default'}
                    onValueChange={(value) => patch({ widget: value === 'default' ? undefined : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      {availableWidgets.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name} (custom)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(node.default)}
                  onCheckedChange={(checked) => patch({ default: checked === true })}
                />
                Default checked
              </label>
            </>
          )}
        </>
      )}

      {node.kind === 'multiselect' && (
        <Field label="Options">
          <EnumEditor options={node.enumOptions} onChange={(enumOptions) => patch({ enumOptions })} />
        </Field>
      )}

      {node.kind === 'array' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min items">
            <Input
              type="number"
              value={node.minItems ?? ''}
              onChange={(e) => patch({ minItems: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </Field>
          <Field label="Max items">
            <Input
              type="number"
              value={node.maxItems ?? ''}
              onChange={(e) => patch({ maxItems: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </Field>
        </div>
      )}

      {node.kind === 'raw' && (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs text-destructive">
            <Trash2 className="size-3.5" /> Unsupported schema shape
          </p>
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-2 text-[11px]">
            {JSON.stringify(node.schema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
