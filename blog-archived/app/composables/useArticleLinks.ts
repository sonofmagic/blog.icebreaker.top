import { createArticlesQuery, mapToArticleSummary } from '@/api/article'
import { useAsyncData } from '#imports'

export function useArticleLinks() {
  return useAsyncData('article-links', async () => {
    const items = await createArticlesQuery()
      .select('id', 'path', 'title', 'description', 'tags', 'date')
      .order('date', 'DESC')
      .all()

    return items.map(mapToArticleSummary).map(({ id, path, title, description, tags, date }) => ({
      id,
      path,
      title,
      description,
      tags,
      date,
    }))
  })
}
