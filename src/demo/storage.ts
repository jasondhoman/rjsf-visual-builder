import type { BuilderDocument } from './types'

const STORAGE_KEY = 'rjsf-builder:document'

/** Persists the current document to localStorage so it survives a page reload. */
export function saveDocumentToStorage(document: BuilderDocument): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
  } catch (error) {
    console.warn('Failed to save form builder document to storage', error)
  }
}

export function loadDocumentFromStorage(): BuilderDocument | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    return JSON.parse(raw) as BuilderDocument
  } catch (error) {
    console.warn('Failed to load form builder document from storage', error)
    return undefined
  }
}

export function clearStoredDocument(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
