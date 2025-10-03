import { setHeader } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = (config.public.siteUrl as string | undefined) ?? 'https://blog.icebreaker.top'
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return `User-agent: *\nAllow: /\n\nSitemap: ${normalizedSiteUrl}/sitemap.xml\n`
})
