import { createContext, useContext } from 'react'
import type { BuilderAction } from '@/lib/visual/reducer'

export type BuilderSelection =
  | { kind: 'node'; id: string }
  | { kind: 'branch'; nodeId: string; branchId: string }
  | undefined

interface BuilderContextValue {
  dispatch: (action: BuilderAction) => void
  selection: BuilderSelection
  select: (selection: BuilderSelection) => void
}

export const BuilderContext = createContext<BuilderContextValue | null>(null)

export function useBuilderContext(): BuilderContextValue {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilderContext must be used within a BuilderContext.Provider')
  return ctx
}
