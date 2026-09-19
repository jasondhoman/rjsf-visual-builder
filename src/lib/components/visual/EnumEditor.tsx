import { Plus, X } from 'lucide-react'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'
import { Textarea } from '@/lib/ui/textarea'
import { useState } from 'react'

interface EnumEditorProps {
  options: string[]
  onChange: (options: string[]) => void
}

/** Editable list of string options, used for select/multi-select field enums. */
export function EnumEditor({ options, onChange }: EnumEditorProps) {
  const [mode, setMode] = useState<'paste' | 'rows'>('paste')

  function updateOption(index: number, value: string) {
    const next = options.slice()
    next[index] = value
    onChange(next)
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function addOption() {
    onChange([...options, `Option ${options.length + 1}`])
  }

  function updateOptions(value: string) {
    const next = value
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean)
    onChange(next.length > 0 ? next : [''])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 rounded-md border bg-muted/40 p-1" role="tablist" aria-label="Option editing mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          className={`rounded px-2 py-1 text-xs ${mode === 'paste' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setMode('paste')}
        >
          Paste options
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'rows'}
          className={`rounded px-2 py-1 text-xs ${mode === 'rows' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setMode('rows')}
        >
          Edit rows
        </button>
      </div>

      {mode === 'paste' ? (
        <Textarea
          value={options.join('\n')}
          onChange={(event) => updateOptions(event.target.value)}
          placeholder="Paste one option per line"
          rows={4}
          className="text-sm"
          aria-label="Options, one per line"
          role="tabpanel"
        />
      ) : (
        <div className="flex flex-col gap-1.5" role="tabpanel">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input value={option} onChange={(e) => updateOption(index, e.target.value)} className="h-8 text-sm" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => removeOption(index)}
                disabled={options.length <= 1}
                aria-label={`Remove option ${index + 1}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={addOption}>
            <Plus className="size-3.5" /> Add option
          </Button>
        </div>
      )}
    </div>
  )
}
