export type { BuilderDocument } from '@/lib/types'
import type { BuilderDocument } from '@/lib/types'

export interface BuilderPreset {
  id: string
  name: string
  description: string
  document: BuilderDocument
}
