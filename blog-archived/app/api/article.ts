import { queryCollection } from '#imports'

export interface ArticleRecord {
  id?: string
  _id?: string
  path?: string
  _path?: string
  title?: unknown
  description?: unknown
  date?: unknown
  tags?: unknown
  readingMinutes?: unknown
  readingWords?: unknown
  draft?: unknown
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

export function createArticlesQuery() {
  return queryCollection('articles').andWhere(group =>
    group
      .where('draft', 'IS NULL')
      .orWhere(orGroup => orGroup.where('draft', '<>', true)),
  )
}

export async function getPageList({ page, perPage }: ArticlePageQuery) {
  const safePage = Math.max(1, page)
  const safePerPage = Math.max(1, perPage)
  const offset = (safePage - 1) * safePerPage

  const [total, items] = await Promise.all([
    createArticlesQuery().count('id'),
    createArticlesQuery()
      .select('id', 'path', 'title', 'description', 'date', 'tags', 'readingMinutes', 'readingWords')
      .order('date', 'DESC')
      .skip(offset)
      .limit(safePerPage)
      .all(),
  ])

  return {
    total,
    articles: items.map(mapToArticleSummary),
  }
}

export async function searchArticles(keyword: string) {
  const normalized = keyword.trim()
  if (!normalized) {
    return []
  }

  const likeTerm = `%${normalized.replace(/[%_]/g, '')}%`
  const matches = await createArticlesQuery()
    .andWhere(group =>
      group
        .where('title', 'LIKE', likeTerm)
        .orWhere(orGroup => orGroup.where('description', 'LIKE', likeTerm)),
    )
    .order('date', 'DESC')
    .select('id', 'path', 'title', 'description', 'date', 'tags')
    .limit(50)
    .all()

  return matches.map(mapToArticleSummary)
}

export function mapToArticleSummary(article: ArticleRecord): ArticleSummary {
  return {
    id: resolveId(article),
    path: resolvePath(article),
    title: asOptionalString(article.title) ?? 'Untitled',
    description: asOptionalString(article.description),
    date: asOptionalString(article.date),
    tags: normalizeTags(article.tags),
    readingMinutes: asOptionalNumber(article.readingMinutes),
    readingWords: asOptionalNumber(article.readingWords),
  }
}

function resolveId(article: ArticleRecord) {
  return (
    (typeof article.id === 'string' && article.id) ||
    (typeof article._id === 'string' && article._id) ||
    resolvePath(article)
  )
}

function resolvePath(article: ArticleRecord) {
  const candidate =
    (typeof article.path === 'string' && article.path) ||
    (typeof article._path === 'string' && article._path)
  return candidate || '/'
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
  }
  if (typeof value === 'string' && value.length > 0) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
      }
    } catch {
      return []
    }
  }
  return []
}
