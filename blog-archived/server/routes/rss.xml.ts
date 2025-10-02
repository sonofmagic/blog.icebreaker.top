import { defineEventHandler, setHeader } from 'h3'
import { createSiteFeed } from '../utils/feed'

export default defineEventHandler(async (event) => {
  const feed = await createSiteFeed(event)
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return feed.rss2()
})
