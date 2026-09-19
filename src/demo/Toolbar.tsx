import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/select'
import { Button } from '@/lib/ui/button'
import { Download, FileJson2 } from 'lucide-react'
import { presets } from '@/demo/presets'

interface ToolbarProps {
  activePresetId: string | null
  onSelectPreset: (id: string) => void
  onDownloadJson: () => void
  onCopySnippet: () => void
}

/**
 * Demo-only chrome around the published <RjsfFormBuilder /> component: lets
 * you switch which starting schema is loaded, and export the last-saved
 * document. None of this ships in the npm package.
 */
export function Toolbar({
  activePresetId,
  onSelectPreset,
  onDownloadJson,
  onCopySnippet,
}: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold">rjsf-visual-builder demo</h1>
        <span className="text-xs text-muted-foreground">
          Powered by @rjsf/core &amp; @rjsf/validator-ajv8
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={activePresetId ?? undefined} onValueChange={onSelectPreset}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="Load a preset…" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onDownloadJson}>
          <Download />
          Download last saved JSON
        </Button>
        <Button variant="default" size="sm" onClick={onCopySnippet}>
          <FileJson2 />
          Copy React snippet
        </Button>
      </div>
    </header>
  )
}
