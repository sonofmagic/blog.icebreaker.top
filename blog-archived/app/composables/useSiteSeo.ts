import type { MaybeRefOrGetter } from 'vue'
import { useRoute, useRuntimeConfig, useSeoMeta } from '#imports'
import { computed, toValue } from 'vue'

interface SiteSeoInput {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  noindex?: boolean
  path?: string
}

function resolveAbsoluteUrl(pathOrUrl: string | undefined, siteUrl: string) {
  if (!pathOrUrl) {
    return siteUrl
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${normalizedSiteUrl}${normalizedPath}`
}

export function useSiteSeo(meta: MaybeRefOrGetter<SiteSeoInput> = {}) {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()

  const {
    siteUrl = 'https://blog.icebreaker.top',
    siteName = 'icebreaker / notes',
    siteTagline = '写字、做实验、保持好奇',
    defaultDescription = siteTagline,
    defaultOgImage = '/icon.png',
  } = runtimeConfig.public ?? {}

  const resolved = computed(() => {
    const input = toValue(meta) ?? {}

    const canonicalPath = input.path ?? route.path ?? '/'
    const canonicalUrl = resolveAbsoluteUrl(canonicalPath, siteUrl)
    const description = input.description ?? defaultDescription
    const title = input.title ?? siteName
    const ogImage = resolveAbsoluteUrl(input.image ?? defaultOgImage, siteUrl)
    const robots = input.noindex ? 'noindex, nofollow' : 'index, follow'

    return {
      canonicalUrl,
      title,
      description,
      ogImage,
      meta: {
        title,
        description,
        ogType: input.type ?? 'website',
        ogTitle: title,
        ogDescription: description,
        ogUrl: canonicalUrl,
        ogSiteName: siteName,
        ogImage,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        canonical: canonicalUrl,
        robots,
        articlePublishedTime: input.publishedTime,
        articleModifiedTime: input.modifiedTime,
        articleTag: input.tags,
      },
    }
  })

  useSeoMeta(() => resolved.value.meta)

  return resolved
}
