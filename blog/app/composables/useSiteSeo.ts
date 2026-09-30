import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useHead, useRoute, useRuntimeConfig, useSeoMeta } from '#imports'

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
      fullTitle: title === siteName ? siteName : `${title} · ${siteName}`,
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
        twitterCard: 'summary_large_image' as const,
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        robots,
        articlePublishedTime: input.publishedTime,
        articleModifiedTime: input.modifiedTime,
        articleTag: input.tags,
      },
    }
  })

  useSeoMeta({
    title: () => resolved.value.meta.title,
    description: () => resolved.value.meta.description,
    ogType: () => resolved.value.meta.ogType,
    ogTitle: () => resolved.value.meta.ogTitle,
    ogDescription: () => resolved.value.meta.ogDescription,
    ogUrl: () => resolved.value.meta.ogUrl,
    ogSiteName: () => resolved.value.meta.ogSiteName,
    ogImage: () => resolved.value.meta.ogImage,
    twitterCard: () => resolved.value.meta.twitterCard,
    twitterTitle: () => resolved.value.meta.twitterTitle,
    twitterDescription: () => resolved.value.meta.twitterDescription,
    twitterImage: () => resolved.value.meta.twitterImage,
    robots: () => resolved.value.meta.robots,
    articlePublishedTime: () => resolved.value.meta.articlePublishedTime,
    articleModifiedTime: () => resolved.value.meta.articleModifiedTime,
    articleTag: () => resolved.value.meta.articleTag,
  })
  useHead(() => ({
    title: resolved.value.fullTitle,
    titleTemplate: '%s',
    htmlAttrs: {
      lang: 'zh-Hans',
    },
    link: [
      {
        rel: 'canonical',
        href: resolved.value.canonicalUrl,
      },
    ],
  }))

  return resolved
}
