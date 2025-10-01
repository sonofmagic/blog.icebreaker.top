import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import { queryContent, useAsyncData } from '#imports'

export function useArticleLinks() {
  return useAsyncData('article-links', async () => {
    const entries = await queryContent<ParsedContent>('articles')
      .where({ draft: { $ne: true } })
      .only(['_id', '_path', 'title', 'description', 'tags', 'date'])
      .sort({ date: -1 })
      .find()

    return entries.map((entry) => ({
      id: entry._id ?? entry._path ?? '',
      path: entry._path ?? '/',
      title: entry.title ?? 'Untitled',
      description: entry.description,
      tags: entry.tags,
      date: entry.date,
    }))
  })
}
