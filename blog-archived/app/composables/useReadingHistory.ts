import { computed, onMounted, readonly, ref } from 'vue'

export interface ReadingHistoryItem {
  path: string
  title: string
  date?: string
  tags: string[]
  readAt: number
  scrollTop?: number
  progress?: number
}

const STORAGE_KEY = 'icebreaker:reading-history'
const MAX_HISTORY_ITEMS = 8

const items = ref<ReadingHistoryItem[]>([])
const isLoaded = ref(false)

function normalizeItem(value: unknown): ReadingHistoryItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Partial<ReadingHistoryItem>
  if (typeof record.path !== 'string' || !record.path.startsWith('/articles/')) {
    return null
  }
  if (typeof record.title !== 'string' || record.title.trim().length === 0) {
    return null
  }

  return {
    path: record.path,
    title: record.title.trim(),
    date: typeof record.date === 'string' ? record.date : undefined,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    readAt: typeof record.readAt === 'number' && Number.isFinite(record.readAt) ? record.readAt : Date.now(),
    scrollTop: typeof record.scrollTop === 'number' && Number.isFinite(record.scrollTop) && record.scrollTop > 0
      ? Math.round(record.scrollTop)
      : undefined,
    progress: typeof record.progress === 'number' && Number.isFinite(record.progress) && record.progress > 0
      ? Math.min(100, Math.max(0, Math.round(record.progress)))
      : undefined,
  }
}

function persistHistory() {
  if (!import.meta.client) {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

function loadHistory() {
  if (!import.meta.client || isLoaded.value) {
    return
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    items.value = Array.isArray(parsed)
      ? parsed
          .map(normalizeItem)
          .filter((item): item is ReadingHistoryItem => Boolean(item))
          .sort((a, b) => b.readAt - a.readAt)
          .slice(0, MAX_HISTORY_ITEMS)
      : []
  }
  catch {
    items.value = []
  }
  isLoaded.value = true
}

function recordReading(input: Omit<ReadingHistoryItem, 'readAt'>) {
  if (!import.meta.client) {
    return
  }

  loadHistory()

  const nextItem = normalizeItem({
    ...input,
    readAt: Date.now(),
  })
  if (!nextItem) {
    return
  }

  const previousItem = items.value.find(item => item.path === nextItem.path)
  if (previousItem?.scrollTop && !nextItem.scrollTop) {
    nextItem.scrollTop = previousItem.scrollTop
  }
  if (previousItem?.progress && !nextItem.progress) {
    nextItem.progress = previousItem.progress
  }

  items.value = [
    nextItem,
    ...items.value.filter(item => item.path !== nextItem.path),
  ].slice(0, MAX_HISTORY_ITEMS)

  persistHistory()
}

function updateReadingPosition(path: string, scrollTop: number, progress: number) {
  if (!import.meta.client || !path.startsWith('/articles/')) {
    return
  }

  loadHistory()

  const current = items.value.find(item => item.path === path)
  if (!current) {
    return
  }

  current.scrollTop = Math.max(0, Math.round(scrollTop))
  current.progress = Math.min(100, Math.max(0, Math.round(progress)))
  persistHistory()
}

function getReadingPosition(path: string) {
  loadHistory()
  const current = items.value.find(item => item.path === path)
  if (!current || !current.scrollTop || !current.progress || current.progress < 6 || current.progress > 94) {
    return null
  }
  return {
    scrollTop: current.scrollTop,
    progress: current.progress,
  }
}

function clearReadingHistory() {
  items.value = []
  if (import.meta.client) {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

function restoreReadingHistory(historyItems: readonly ReadingHistoryItem[]) {
  const nextItems = historyItems
    .map(normalizeItem)
    .filter((item): item is ReadingHistoryItem => Boolean(item))
    .sort((a, b) => b.readAt - a.readAt)
    .slice(0, MAX_HISTORY_ITEMS)

  items.value = nextItems

  if (!import.meta.client) {
    return
  }

  if (nextItems.length > 0) {
    persistHistory()
  }
  else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function useReadingHistory() {
  onMounted(loadHistory)

  return {
    items: readonly(items),
    recentItems: computed(() => items.value.slice(0, 3)),
    isLoaded: readonly(isLoaded),
    recordReading,
    updateReadingPosition,
    getReadingPosition,
    clearReadingHistory,
    restoreReadingHistory,
  }
}
