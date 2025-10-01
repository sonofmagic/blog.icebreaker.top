import type { H3Event } from 'h3'
import { queryCollection } from '#content/server'
import { useRuntimeConfig } from '#imports'
import { Feed } from 'feed'
import { joinURL } from 'ufo'

interface ArticleRecord {
  id?: string
  _id?: string
  path?: string
  _path?: string
  title?: unknown
  description?: unknown
  summary?: unknown
  date?: unknown
  authors?: Array<{ name?: string, email?: string }>
  tags?: unknown
  meta?: Record<string, unknown>
}

export async function createSiteFeed(event: H3Event) {
  const config = useRuntimeConfig(event)
  const siteUrl = config.public.siteUrl || 'https://www.icebreaker.top'

  const feed = new Feed({
    title: 'icebreaker',
    description: '一位打字员',
    id: siteUrl,
    link: siteUrl,
    language: 'zh-cn',
    copyright: `Copyright ${new Date().getFullYear()} icebreaker`,
    generator: 'icebreaker.top',
    author: {
      name: 'icebreaker',
      email: '1324318532@qq.com',
      link: siteUrl,
    },
    image: joinURL(siteUrl, '/favicon.ico'),
    favicon: joinURL(siteUrl, '/favicon.ico'),
  })

  const articles = await queryCollection(event, 'articles')
    .andWhere(group =>
      group
        .where('draft', 'IS NULL')
        .orWhere(orGroup => orGroup.where('draft', '<>', true)),
    )
    .order('date', 'DESC')
    .all()

  for (const article of articles as ArticleRecord[]) {
    const path = resolvePath(article)
    const link = joinURL(siteUrl, path)
    const content = resolveSummary(article)

    feed.addItem({
      title: asOptionalString(article.title) ?? link,
      id: resolveId(article) ?? link,
      link,
      date: resolveDate(article.date),
      description: asOptionalString(article.description),
      content,
      category: normalizeTags(article.tags).map(tag => ({ term: tag })),
    })
  }

  return feed
}

function resolveId(article: ArticleRecord) {
  if (typeof article.id === 'string' && article.id) {
    return article.id
  }
  if (typeof article._id === 'string' && article._id) {
    return article._id
  }
  return undefined
}

function resolvePath(article: ArticleRecord) {
  if (typeof article.path === 'string' && article.path) {
    return article.path
  }
  if (typeof article._path === 'string' && article._path) {
    return article._path
  }
  return '/'
}

function resolveSummary(article: ArticleRecord) {
  if (typeof article.summary === 'string' && article.summary) {
    return article.summary
  }
  const metaSummary = article.meta?.summary
  if (typeof metaSummary === 'string' && metaSummary) {
    return metaSummary
  }
  const excerpt = (article as Record<string, unknown>).excerpt
  if (typeof excerpt === 'string' && excerpt) {
    return excerpt
  }
  return undefined
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function resolveDate(value: unknown) {
  const asString = asOptionalString(value)
  if (asString) {
    const parsed = new Date(asString)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date()
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
