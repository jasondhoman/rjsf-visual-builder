import { Plus, X } from 'lucide-react'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'

interface EnumEditorProps {
  options: string[]
  onChange: (options: string[]) => void
}

/** Editable list of string options, used for select/multi-select field enums. */
export function EnumEditor({ options, onChange }: EnumEditorProps) {
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

  return (
    <div className="flex flex-col gap-1.5">
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
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addOption}>
        <Plus className="size-3.5" /> Add option
      </Button>
    </div>
  )
}
