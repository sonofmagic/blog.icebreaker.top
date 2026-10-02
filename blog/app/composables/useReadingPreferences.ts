import type { ReadingPreferences } from '@/utils/reading'
import { loadReadingPreferences, normalizeReadingPreferences, saveReadingPreferences } from '@/utils/reading'

export function useReadingPreferences() {
  const preferences = useState<ReadingPreferences>('reading-preferences', () => normalizeReadingPreferences(null))

  function restore() {
    try {
      preferences.value = loadReadingPreferences(window.localStorage)
    }
    catch {
      // Some browsers reject access to localStorage itself.
    }
  }

  function update(value: ReadingPreferences) {
    preferences.value = normalizeReadingPreferences(value)
    try {
      saveReadingPreferences(window.localStorage, preferences.value)
    }
    catch {
      // Keep the in-memory preference when persistence is unavailable.
    }
  }

  return { preferences, restore, update }
}
