import type { BuilderPreset } from '../types'
import { arraysAndNestingPreset } from './arrays-and-nesting'
import { basicInfoPreset } from './basic-info'
import { conditionalFieldsPreset } from './conditional-fields'

export const presets: BuilderPreset[] = [
  basicInfoPreset,
  arraysAndNestingPreset,
  conditionalFieldsPreset,
]

export const defaultPreset = presets[0]

export function findPreset(id: string): BuilderPreset | undefined {
  return presets.find((preset) => preset.id === id)
}
