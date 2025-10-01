import type { H3Event } from 'h3'
import { serverQueryContent } from '#content/server'
import { useRuntimeConfig } from '#imports'
import { Feed } from 'feed'
import { joinURL } from 'ufo'

interface Article {
  _path?: string
  _id?: string
  title?: string
  description?: string
  summary?: string
  date?: string
  authors?: Array<{ name?: string, email?: string }>
  tags?: string[]
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

  const articles = await serverQueryContent<Article>(event, 'articles')
    .where({ draft: { $ne: true } })
    .sort({ date: -1 })
    .find()

  for (const article of articles) {
    const path = article._path || '/'
    const link = joinURL(siteUrl, path)

    const content = article.summary ?? (article as any).excerpt

    feed.addItem({
      title: article.title || link,
      id: article._id || link,
      link,
      date: article.date ? new Date(article.date) : new Date(),
      description: article.description,
      content,
      category: Array.isArray(article.tags)
        ? article.tags.map(tag => ({ term: tag }))
        : undefined,
    })
  }

  return feed
}
