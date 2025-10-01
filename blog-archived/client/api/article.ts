import { queryContent } from '#imports'

type ArticleListItem = {
  _id?: string
  _path?: string
  title?: string
  description?: string
  date?: string
  tags?: string[]
  readingMinutes?: number
  readingWords?: number
}

export interface ArticlePageQuery {
  page: number
  perPage: number
}

export interface ArticleSummary {
  id: string
  path: string
  title: string
  description?: string
  date?: string
  tags: string[]
  readingMinutes?: number
  readingWords?: number
}

export async function getPageList(query: ArticlePageQuery) {
  const { page, perPage } = query
  const items = await queryContent<ArticleListItem>('articles')
    .where({ draft: { $ne: true } })
    .sort({ date: -1 })
    .only(['_id', '_path', 'title', 'description', 'date', 'tags', 'readingMinutes', 'readingWords'])
    .find()

  const total = items.length
  const start = Math.max(0, (page - 1) * perPage)
  const end = start + perPage
  const articles = items.slice(start, end)

  const mapped: ArticleSummary[] = articles.map((article) => ({
    id: article._id || article._path || '',
    path: article._path || '/',
    title: article.title ?? 'Untitled',
    description: article.description,
    date: article.date,
    tags: article.tags ?? [],
    readingMinutes: article.readingMinutes,
    readingWords: article.readingWords,
  }))

  return {
    total,
    articles: mapped,
  }
}

export async function searchArticles(keyword: string) {
  const matches = await queryContent<ArticleListItem>('articles')
    .where({ draft: { $ne: true } })
    .search(keyword)
    .sort({ date: -1 })
    .only(['_id', '_path', 'title', 'description', 'date', 'tags'])
    .find()

  return matches.map<ArticleSummary>((article) => ({
    id: article._id || article._path || '',
    path: article._path || '/',
    title: article.title ?? 'Untitled',
    description: article.description,
    date: article.date,
    tags: article.tags ?? [],
  }))
}
