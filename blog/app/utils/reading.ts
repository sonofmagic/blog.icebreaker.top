export interface ReadingPreferences {
  fontSize: 16 | 18 | 20
  focus: boolean
}

export const READING_PREFERENCES_KEY = 'icebreaker:reading-preferences'

export function normalizeReadingPreferences(value: unknown): ReadingPreferences {
  const record = value && typeof value === 'object' ? value as Partial<ReadingPreferences> : {}
  return {
    fontSize: record.fontSize === 16 || record.fontSize === 20 ? record.fontSize : 18,
    focus: record.focus === true,
  }
}

export function loadReadingPreferences(storage: Pick<Storage, 'getItem'>): ReadingPreferences {
  try {
    return normalizeReadingPreferences(JSON.parse(storage.getItem(READING_PREFERENCES_KEY) || 'null'))
  }
  catch {
    return normalizeReadingPreferences(null)
  }
}

export function saveReadingPreferences(storage: Pick<Storage, 'setItem'>, value: ReadingPreferences) {
  try {
    storage.setItem(READING_PREFERENCES_KEY, JSON.stringify(normalizeReadingPreferences(value)))
  }
  catch {
    // Reading controls remain usable when storage is unavailable or full.
  }
}

export function readingRange(top: number, height: number, viewport: number) {
  const start = Math.max(0, top - 120)
  return { start, end: Math.max(start + 1, top + height - viewport * 0.65) }
}

export function readingProgressAt(scrollTop: number, range: { start: number, end: number }) {
  return Math.min(100, Math.max(0, (scrollTop - range.start) / (range.end - range.start) * 100))
}

export function readingPositionAt(progress: number, range: { start: number, end: number }) {
  const normalized = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0
  return range.start + (range.end - range.start) * normalized / 100
}

export function anchoredScrollTop(scrollTop: number, previousTop: number, nextTop: number) {
  return Math.max(0, scrollTop + nextTop - previousTop)
}
