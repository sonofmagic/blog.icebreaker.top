import { describe, expect, it } from 'vitest'
import { buildTocLinksFromBody, extractFirstParagraphText } from './contentBody'

describe('content body fallbacks', () => {
  it('reads descriptions and nested headings from Content 3 minimark bodies without a TOC', () => {
    const body = {
      type: 'minimark',
      value: [
        ['p', {}, ''],
        ['p', {}, 'A  ', ['strong', {}, 'formatted'], '\n description.'],
        ['h2', { id: 'install' }, 'Install ', ['code', {}, 'Nuxt']],
        ['h3', { id: 'configure' }, 'Configure'],
        ['h2', { id: 'run' }, 'Run'],
        ['h2', {}, 'No anchor'],
      ],
    }
    expect(extractFirstParagraphText(body)).toBe('A formatted description.')
    expect(buildTocLinksFromBody(body)).toEqual([
      { id: 'install', depth: 2, text: 'Install Nuxt', children: [{ id: 'configure', depth: 3, text: 'Configure' }] },
      { id: 'run', depth: 2, text: 'Run' },
    ])
  })

  it('preserves descriptions and anchors from legacy object bodies', () => {
    const body = {
      children: [
        { tag: 'p', children: [{ type: 'text', value: 'Legacy description' }] },
        { tag: 'h2', props: { id: 'legacy' }, children: [{ type: 'text', value: 'Legacy heading' }] },
      ],
    }
    expect(extractFirstParagraphText(body)).toBe('Legacy description')
    expect(buildTocLinksFromBody(body)).toEqual([{ id: 'legacy', depth: 2, text: 'Legacy heading' }])
  })

  it('handles missing or malformed content without breaking article rendering', () => {
    for (const body of [null, undefined, {}, { value: [null, {}, ['h2', null]] }]) {
      expect(extractFirstParagraphText(body)).toBeUndefined()
      expect(buildTocLinksFromBody(body)).toEqual([])
    }
  })
})
