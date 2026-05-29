import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'icebreaker:reading-history'

class LocalStorageMock {
  private store = new Map<string, string>()

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

async function loadReadingHistory() {
  vi.resetModules()
  return await import('./useReadingHistory')
}

describe('useReadingHistory', () => {
  let localStorage: LocalStorageMock

  beforeEach(() => {
    localStorage = new LocalStorageMock()
    vi.stubGlobal('window', { localStorage })
    vi.setSystemTime(new Date('2026-05-28T08:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('records recent articles with newest item first and keeps existing reading position', async () => {
    const { useReadingHistory } = await loadReadingHistory()
    const history = useReadingHistory()

    history.recordReading({
      path: '/articles/a',
      title: '第一篇',
      tags: ['nuxt'],
      scrollTop: 360,
      progress: 42,
    })

    vi.setSystemTime(new Date('2026-05-28T08:01:00.000Z'))
    history.recordReading({
      path: '/articles/b',
      title: '第二篇',
      tags: ['vue'],
    })

    vi.setSystemTime(new Date('2026-05-28T08:02:00.000Z'))
    history.recordReading({
      path: '/articles/a',
      title: '第一篇更新',
      tags: ['nuxt', 'design'],
    })

    expect(history.recentItems.value.map(item => item.path)).toEqual([
      '/articles/a',
      '/articles/b',
    ])
    expect(history.items.value[0]).toMatchObject({
      title: '第一篇更新',
      scrollTop: 360,
      progress: 42,
    })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(2)
  })

  it('saves resumable reading positions only for useful progress ranges', async () => {
    const { useReadingHistory } = await loadReadingHistory()
    const history = useReadingHistory()

    history.recordReading({
      path: '/articles/resume',
      title: '可继续阅读',
      tags: [],
    })
    history.updateReadingPosition('/articles/resume', 421.6, 33.4)

    expect(history.getReadingPosition('/articles/resume')).toEqual({
      scrollTop: 422,
      progress: 33,
    })

    history.updateReadingPosition('/articles/resume', 1000, 98)
    expect(history.getReadingPosition('/articles/resume')).toBeNull()
  })

  it('clears and restores normalized reading history', async () => {
    const { useReadingHistory } = await loadReadingHistory()
    const history = useReadingHistory()

    history.restoreReadingHistory([
      {
        path: '/articles/valid',
        title: '  有效文章  ',
        tags: ['vue', 123 as unknown as string],
        readAt: 20,
      },
      {
        path: '/notes/invalid',
        title: '无效路径',
        tags: [],
        readAt: 30,
      },
      {
        path: '/articles/newer',
        title: '更新文章',
        tags: ['nuxt'],
        readAt: 40,
      },
    ])

    expect(history.items.value.map(item => item.path)).toEqual([
      '/articles/newer',
      '/articles/valid',
    ])
    expect(history.items.value[1]?.title).toBe('有效文章')
    expect(history.items.value[1]?.tags).toEqual(['vue'])

    history.clearReadingHistory()
    expect(history.items.value).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
