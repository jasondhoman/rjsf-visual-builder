import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { RjsfFormBuilder, type BuilderDocument } from '@/lib'
import { Toolbar } from '@/demo/Toolbar'
import { defaultPreset, findPreset } from '@/demo/presets'
import { copyToClipboard, downloadDocumentAsJson, generateStandaloneComponent } from '@/demo/export'
import { demoFields, demoWidgets } from '@/demo/customWidgets'

/**
 * Local playground for developing the published <RjsfFormBuilder />
 * component. This whole file (and everything else under src/demo) is dev
 * tooling only — none of it ships in the `rjsf-visual-builder` package.
 * Toasts here demonstrate that the library itself never shows
 * notifications; the host app decides how (and whether) to surface them.
 */
function App() {
  const [activePresetId, setActivePresetId] = useState<string | null>(defaultPreset.id)
  const [builderKey, setBuilderKey] = useState(0)
  const [initialDocument, setInitialDocument] = useState<BuilderDocument>(defaultPreset.document)
  const [lastSaved] = useState<BuilderDocument>(defaultPreset.document)

  function handleSelectPreset(id: string) {
    const preset = findPreset(id)
    if (!preset) return
    setInitialDocument(preset.document)
    setActivePresetId(preset.id)
    // RjsfFormBuilder only reads its schema/uiSchema/formData props once, on
    // mount, so remount it (via `key`) to load a different starting schema.
    setBuilderKey((key) => key + 1)
    toast.info(`Loaded preset: ${preset.name}`)
  }

  function handleDownloadJson() {
    downloadDocumentAsJson(lastSaved)
  }

  async function handleCopySnippet() {
    try {
      await copyToClipboard(generateStandaloneComponent(lastSaved))
      toast.success('React component snippet copied to clipboard.')
    } catch {
      toast.error('Could not copy to clipboard.')
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onDownloadJson={handleDownloadJson}
        onCopySnippet={handleCopySnippet}
      />
      <main className="min-h-0 flex-1 p-4">
        <RjsfFormBuilder
          key={builderKey}
          schema={initialDocument.schema}
          uiSchema={initialDocument.uiSchema}
          formData={initialDocument.formData}
          widgets={demoWidgets}
          fields={demoFields}
          onPreviewSubmit={(formData) => {
            console.log('Preview form submitted:', formData)
            toast.success('Form submitted — see console for the data.')
          }}
          onPreviewValidationError={() => toast.error('Form has validation errors.')}
        />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}

export default App
