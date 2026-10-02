import { describe, expect, it } from 'vitest'
import { anchoredScrollTop, loadReadingPreferences, normalizeReadingPreferences, readingPositionAt, readingProgressAt, readingRange, saveReadingPreferences } from './reading'

describe('reader preferences', () => {
  it('accepts supported values and rejects invalid stored settings', () => {
    expect(normalizeReadingPreferences({ fontSize: 20, focus: true })).toEqual({ fontSize: 20, focus: true })
    for (const value of [null, [], '20', { fontSize: 200, focus: 'true' }]) {
      expect(normalizeReadingPreferences(value)).toEqual({ fontSize: 18, focus: false })
    }
    expect(loadReadingPreferences({ getItem: () => '{broken' })).toEqual({ fontSize: 18, focus: false })
  })

  it('continues reading when storage is denied or full', () => {
    expect(loadReadingPreferences({ getItem: () => {
      throw new Error('Denied')
    } })).toEqual({ fontSize: 18, focus: false })
    expect(() => saveReadingPreferences({ setItem: () => {
      throw new Error('Full')
    } }, { fontSize: 16, focus: true })).not.toThrow()
  })
})

describe('body reading position', () => {
  it('ignores the header and footer and clamps progress at the body boundaries', () => {
    const range = readingRange(500, 3000, 1000)
    expect(readingProgressAt(0, range)).toBe(0)
    expect(readingProgressAt(380, range)).toBe(0)
    expect(readingProgressAt(2850, range)).toBe(100)
    expect(readingProgressAt(6000, range)).toBe(100)
  })

  it('restores progress after a change of type size or viewport', () => {
    const oldRange = readingRange(500, 3000, 1000)
    const newRange = readingRange(400, 5000, 844)
    const position = readingPositionAt(42, oldRange)
    const restored = readingPositionAt(readingProgressAt(position, oldRange), newRange)
    expect(restored).not.toBe(position)
    expect(readingProgressAt(restored, newRange)).toBeCloseTo(42)
    expect(readingPositionAt(Number.NaN, newRange)).toBe(newRange.start)
    expect(readingPositionAt(200, newRange)).toBe(newRange.end)
  })

  it('handles articles shorter than a viewport without division by zero', () => {
    const range = readingRange(80, 200, 1000)
    expect(range.end).toBeGreaterThan(range.start)
    expect(readingProgressAt(0, range)).toBe(0)
    expect(readingProgressAt(1, range)).toBe(100)
  })

  it('holds the visible paragraph in place when its layout moves', () => {
    expect(anchoredScrollTop(1000, 120, 340)).toBe(1220)
    expect(anchoredScrollTop(1000, 120, -100)).toBe(780)
    expect(anchoredScrollTop(0, 500, 200)).toBe(0)
  })
})
