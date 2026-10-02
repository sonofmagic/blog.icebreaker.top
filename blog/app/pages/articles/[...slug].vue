<script setup lang="ts">
import type { MarkdownRoot } from '@nuxt/content'
import type { TocLink } from '@/utils/contentBody'
import type { ReadingPreferences } from '@/utils/reading'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import RecentReadingPanel from '@/components/RecentReadingPanel.vue'
import { buildTocLinksFromBody, extractFirstParagraphText } from '@/utils/contentBody'
import { anchoredScrollTop, readingPositionAt, readingProgressAt, readingRange } from '@/utils/reading'

const route = useRoute()
const { preferences, restore: restorePreferences, update: updatePreferences } = useReadingPreferences()
const isSettingsOpen = ref(false)
const {
  recentItems,
  recordReading,
  updateReadingPosition,
  getReadingPosition,
  clearReadingHistory,
  restoreReadingHistory,
} = useReadingHistory()
const slugParam = route.params.slug
const slugSegments = Array.isArray(slugParam) ? slugParam : [slugParam].filter(Boolean)

const contentPath = slugSegments.length ? `/articles/${slugSegments.join('/')}` : null

if (!contentPath) {
  throw createError({ statusCode: 404, message: '文章不存在' })
}

function restoreRecentReading(items?: typeof recentItems.value) {
  if (!items?.length) {
    return
  }

  restoreReadingHistory(items)
}

function parseMeta(entry: Record<string, any>) {
  if (typeof entry.meta === 'string') {
    try {
      return JSON.parse(entry.meta) as Record<string, any>
    }
    catch {
      return {}
    }
  }
  if (entry.meta && typeof entry.meta === 'object') {
    return entry.meta as Record<string, any>
  }
  return {}
}

function normalizeShikiStyleText(value: string) {
  return value
    .replace(/,\s+/g, ',')
    .replace(/\s*\{\s*/g, '{')
    .replace(/:\s+/g, ':')
    .replace(/;\s+/g, ';')
    .replace(/;\}/g, '}')
}

function allowShikiStyleMismatch(node: unknown) {
  if (!node || typeof node !== 'object') {
    return
  }

  if (Array.isArray(node)) {
    if (node[0] === 'style') {
      if (!node[1] || typeof node[1] !== 'object' || Array.isArray(node[1])) {
        node[1] = {}
      }
      const styleProps = node[1] as Record<string, string>
      styleProps['data-allow-mismatch'] = 'children'
      if (typeof node[2] === 'string' && node[2].includes('shiki')) {
        node[2] = normalizeShikiStyleText(node[2])
      }
    }

    for (const child of node) {
      allowShikiStyleMismatch(child)
    }
    return
  }

  const record = node as Record<string, any>
  if (record.tag === 'style') {
    if (!record.props || typeof record.props !== 'object' || Array.isArray(record.props)) {
      record.props = {}
    }
    record.props['data-allow-mismatch'] = 'children'
    if (typeof record.value === 'string' && record.value.includes('shiki')) {
      record.value = normalizeShikiStyleText(record.value)
    }
  }

  if (Array.isArray(record.children)) {
    for (const child of record.children) {
      allowShikiStyleMismatch(child)
    }
  }
  if (Array.isArray(record.value)) {
    for (const child of record.value) {
      allowShikiStyleMismatch(child)
    }
  }
}

const { data: article } = await useAsyncData(`article:${contentPath}`, async () => {
  const entry = await queryCollection('articles')
    .path(contentPath)
    .first()

  if (!entry) {
    return null
  }
  const meta = parseMeta(entry)
  let body: null | MarkdownRoot = entry.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    }
    catch {
      body = null
    }
  }
  allowShikiStyleMismatch(body)
  return {
    ...entry,
    ...meta,
    body,
  }
})

const isArticleMissing = computed(() => !article.value)

if (isArticleMissing.value) {
  setResponseStatus(404)
}

const { data: adjacent } = await useAsyncData(`article-nav:${contentPath}`, async () => {
  const entries = await queryCollection('articles')
    .all()

  const list = (Array.isArray(entries) ? entries : [])
    .map(entry => ({
      ...entry,
      ...parseMeta(entry),
    }))
    .filter(entry => entry.draft !== true)
    .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())

  const currentIndex = list.findIndex(entry => entry.path === contentPath)
  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const older = list[currentIndex + 1] ?? null
  const newer = list[currentIndex - 1] ?? null

  const mapEntry = (entry: any) => entry
    ? {
        path: entry.path,
        title: typeof entry.title === 'string' && entry.title.length > 0 ? entry.title : '未命名',
      }
    : null

  return {
    prev: mapEntry(older),
    next: mapEntry(newer),
  }
})

const tocLinks = computed<TocLink[]>(() => {
  const rawLinks = article.value?.body?.toc?.links
  if (Array.isArray(rawLinks) && rawLinks.length > 0) {
    return rawLinks as TocLink[]
  }
  return buildTocLinksFromBody(article.value?.body)
})
const hasToc = computed(() => tocLinks.value.length > 0)
const isTocOpen = ref(false)
const articleContentRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const hasScrolled = ref(false)
const activeHeadingId = ref<string | null>(null)
const resumePosition = ref<null | { scrollTop: number, progress: number }>(null)
const isResumePromptDismissed = ref(false)
let savePositionTimer: ReturnType<typeof setTimeout> | undefined
let readingFrame: number | undefined
let contentResizeObserver: ResizeObserver | undefined
const previousArticle = computed(() => adjacent.value?.prev ?? null)
const nextArticle = computed(() => adjacent.value?.next ?? null)

const flatTocLinks = computed(() => {
  const links: TocLink[] = []

  function visit(nodes: TocLink[]) {
    for (const node of nodes) {
      links.push(node)
      if (node.children?.length) {
        visit(node.children)
      }
    }
  }

  visit(tocLinks.value)
  return links
})

const articleDetails = computed(() => {
  const record = article.value as Record<string, any> | null
  if (!record) {
    return null
  }

  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : []

  const readingMeta: string[] = []
  if (typeof record.readingMinutes === 'number' && record.readingMinutes > 0) {
    readingMeta.push(`${record.readingMinutes} 分钟阅读`)
  }
  if (typeof record.readingWords === 'number' && record.readingWords > 0) {
    readingMeta.push(`${record.readingWords} 字`)
  }

  return {
    date: typeof record.date === 'string' && record.date.length > 0 ? record.date : '未记录日期',
    tags,
    readingMeta,
  }
})

const articleTitle = computed(() => {
  const record = article.value as Record<string, any> | null
  return typeof record?.title === 'string' && record.title.length > 0 ? record.title : '文章详情'
})

const articleDescription = computed(() => {
  const record = article.value as Record<string, any> | null
  if (!record) {
    return ''
  }
  if (typeof record.description === 'string' && record.description.trim().length > 0) {
    return record.description.trim()
  }
  return extractFirstParagraphText(record.body) ?? ''
})

const shouldShowResumePrompt = computed(() => {
  const progress = resumePosition.value?.progress ?? 0
  return Boolean(
    article.value
    && resumePosition.value
    && !isResumePromptDismissed.value
    && resumePosition.value.scrollTop > 240
    && progress >= 6
    && progress < 95,
  )
})
const resumePromptText = computed(() => {
  const progress = resumePosition.value?.progress ?? 0
  return progress > 0 ? `上次读到 ${progress}%` : '继续上次阅读'
})

function saveReadingPosition(scrollTop: number, progress: number) {
  const path = article.value?.path
  if (!path || progress < 2) {
    return
  }
  updateReadingPosition(path, scrollTop, progress)
}

function scheduleReadingPositionSave(scrollTop: number, progress: number) {
  if (!import.meta.client) {
    return
  }

  if (!article.value?.path || progress < 2) {
    return
  }

  if (savePositionTimer) {
    clearTimeout(savePositionTimer)
  }
  savePositionTimer = setTimeout(() => {
    saveReadingPosition(scrollTop, progress)
  }, 350)
}

function currentReadingRange() {
  const element = articleContentRef.value
  if (!element) {
    return { start: 0, end: 1 }
  }
  return readingRange(element.getBoundingClientRect().top + window.scrollY, element.scrollHeight, window.innerHeight)
}

function getCurrentScrollProgress() {
  return import.meta.client ? readingProgressAt(window.scrollY, currentReadingRange()) : 0
}

function updateActiveHeading() {
  const headings = flatTocLinks.value.map(link => document.getElementById(link.id)).filter((element): element is HTMLElement => Boolean(element))
  const current = headings.filter(element => element.getBoundingClientRect().top <= 160).at(-1)
  activeHeadingId.value = current?.id ?? null
}

function syncReadingState() {
  if (!import.meta.client) {
    return
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  readingProgress.value = getCurrentScrollProgress()
  hasScrolled.value = scrollTop > 480
  updateActiveHeading()
  scheduleReadingPositionSave(scrollTop, readingProgress.value)
}

async function changeReadingPreferences(value: ReadingPreferences) {
  const blocks = articleContentRef.value?.querySelectorAll<HTMLElement>('h2, h3, h4, p, li, pre, table, figure')
  const anchor = Array.from(blocks ?? []).find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.height > 0 && rect.bottom > 100 && rect.top < window.innerHeight
  })
  const previousTop = anchor?.getBoundingClientRect().top
  const scrollTop = window.scrollY
  updatePreferences(value)
  await nextTick()
  if (anchor && previousTop !== undefined && scrollTop > 0) {
    window.scrollTo({ top: anchoredScrollTop(scrollTop, previousTop, anchor.getBoundingClientRect().top), behavior: 'instant' })
  }
  else if (scrollTop === 0) {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  syncReadingState()
}

function scheduleReadingStateSync() {
  if (readingFrame !== undefined) {
    return
  }
  readingFrame = window.requestAnimationFrame(() => {
    readingFrame = undefined
    syncReadingState()
  })
}

function persistReadingStateNow() {
  if (!import.meta.client) {
    return
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  readingProgress.value = getCurrentScrollProgress()
  hasScrolled.value = scrollTop > 480
  saveReadingPosition(scrollTop, readingProgress.value)
}

function getPreferredScrollBehavior(): ScrollBehavior {
  if (!import.meta.client) {
    return 'auto'
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function getScrollFocusDelay() {
  return getPreferredScrollBehavior() === 'smooth' ? 450 : 0
}

function scrollToTop() {
  if (!import.meta.client) {
    return
  }
  window.scrollTo({ top: 0, behavior: getPreferredScrollBehavior() })
  window.setTimeout(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, getScrollFocusDelay())
}

function focusNearestReadableBlock(targetScrollTop: number) {
  if (!import.meta.client || !articleContentRef.value) {
    return
  }

  window.setTimeout(() => {
    const candidates = Array.from(articleContentRef.value!.querySelectorAll<HTMLElement>(
      'h2[id], h3[id], h4[id], p, li, blockquote, pre, table, img',
    ))
      .filter(element => element.offsetParent !== null)

    const target = candidates.find((element) => {
      const elementTop = element.getBoundingClientRect().top + window.scrollY
      return elementTop >= targetScrollTop - 48
    }) ?? candidates[candidates.length - 1]

    if (!target) {
      return
    }

    const previousTabIndex = target.getAttribute('tabindex')
    target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })

    if (previousTabIndex === null) {
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex')
      }, { once: true })
    }
    else {
      target.setAttribute('tabindex', previousTabIndex)
    }
  }, getScrollFocusDelay())
}

async function scrollToResumePosition() {
  if (!import.meta.client || !resumePosition.value) {
    return
  }
  const progress = resumePosition.value.progress
  isResumePromptDismissed.value = true
  await nextTick()
  const scrollTop = readingPositionAt(progress, currentReadingRange())
  window.scrollTo({
    top: scrollTop,
    behavior: getPreferredScrollBehavior(),
  })
  focusNearestReadableBlock(scrollTop)
}

function dismissResumePrompt() {
  isResumePromptDismissed.value = true
}

function recordCurrentArticle() {
  if (!import.meta.client) {
    return
  }

  const record = article.value as Record<string, any> | null
  if (!record || typeof record.path !== 'string' || typeof record.title !== 'string') {
    return
  }

  recordReading({
    path: record.path,
    title: record.title,
    date: typeof record.date === 'string' ? record.date : undefined,
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : [],
  })

  resumePosition.value = getReadingPosition(record.path)
  isResumePromptDismissed.value = false
}

onMounted(() => {
  restorePreferences()
  recordCurrentArticle()
  void nextTick(() => {
    syncReadingState()
    contentResizeObserver = new ResizeObserver(scheduleReadingStateSync)
    if (articleContentRef.value) {
      contentResizeObserver.observe(articleContentRef.value)
    }
  })
  window.addEventListener('scroll', scheduleReadingStateSync, { passive: true })
  window.addEventListener('resize', scheduleReadingStateSync)
  document.addEventListener('visibilitychange', persistReadingStateNow)
  window.addEventListener('pagehide', persistReadingStateNow)
})

onBeforeRouteLeave(() => {
  persistReadingStateNow()
})

watch(
  () => article.value?.path,
  async () => {
    recordCurrentArticle()
    await nextTick()
    syncReadingState()
    isTocOpen.value = false
    isSettingsOpen.value = false
  },
)

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }
  window.removeEventListener('scroll', scheduleReadingStateSync)
  window.removeEventListener('resize', scheduleReadingStateSync)
  if (readingFrame !== undefined) {
    window.cancelAnimationFrame(readingFrame)
  }
  document.removeEventListener('visibilitychange', persistReadingStateNow)
  window.removeEventListener('pagehide', persistReadingStateNow)
  contentResizeObserver?.disconnect()
  if (savePositionTimer) {
    clearTimeout(savePositionTimer)
  }
})

const articleSeo = computed(() => {
  const record = article.value as Record<string, any> | null
  if (!record) {
    return {
      title: '文章不存在',
      description: '文章不存在或已被移动。',
      noindex: true,
      path: contentPath ?? route.path ?? '/',
    }
  }

  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : undefined

  const description = typeof record.description === 'string' && record.description.trim().length > 0
    ? record.description.trim()
    : extractFirstParagraphText(record.body)

  const imageCandidates = [record.ogImage, record.cover, record.image]
  const image = imageCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const publishedTime = typeof record.date === 'string' && record.date.length > 0 ? record.date : undefined
  const modifiedTime = typeof record.updatedAt === 'string' && record.updatedAt.length > 0 ? record.updatedAt : publishedTime

  return {
    title: typeof record.title === 'string' && record.title.length > 0 ? record.title : '文章详情',
    description,
    image,
    type: 'article' as const,
    publishedTime,
    modifiedTime,
    tags,
    path: record.path ?? contentPath ?? route.path ?? '/',
  }
})

useSiteSeo(articleSeo)

function focusHeadingAfterTocMove(id?: string) {
  if (!import.meta.client) {
    return
  }
  window.requestAnimationFrame(() => {
    const heading = id ? document.getElementById(id) : null
    if (!(heading instanceof HTMLElement)) {
      return
    }

    const previousTabIndex = heading.getAttribute('tabindex')
    heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })

    if (previousTabIndex === null) {
      heading.addEventListener('blur', () => {
        heading.removeAttribute('tabindex')
      }, { once: true })
    }
    else {
      heading.setAttribute('tabindex', previousTabIndex)
    }
  })
}

function handleTocMove(id: string) {
  isTocOpen.value = false
  void nextTick(() => focusHeadingAfterTocMove(id))
}
</script>

<template>
  <div class="reading-layout" :class="{ 'reading-layout--focus': preferences.focus }" :style="{ '--reader-font-size': `${preferences.fontSize / 16}rem` }">
    <div v-if="article" class="article-reading-progress" role="progressbar" aria-label="文章阅读进度" :aria-valuenow="Math.round(readingProgress)" :aria-valuemin="0" :aria-valuemax="100">
      <div :style="{ transform: `scaleX(${readingProgress / 100})` }" />
    </div>

    <div class="reading-column">
      <NuxtLink to="/#archive" class="reader-back">
        <UIcon name="i-lucide-arrow-left" class="size-4" />返回归档
      </NuxtLink>
      <header v-if="article" class="article-hero">
        <h1>{{ articleTitle }}</h1>
        <p v-if="articleDescription" class="article-description">
          {{ articleDescription }}
        </p>
        <div class="article-meta">
          <div class="article-meta__details">
            <time :datetime="articleDetails?.date">{{ articleDetails?.date }}</time>
            <span v-for="meta in articleDetails?.readingMeta" :key="meta">{{ meta }}</span>
          </div>
          <ArticleActions :title="articleTitle" :description="articleDescription" />
        </div>
        <ClientOnly>
          <div v-if="shouldShowResumePrompt" class="article-resume-prompt">
            <span>{{ resumePromptText }}</span>
            <button type="button" class="reader-button" @click="scrollToResumePosition">
              继续阅读 <span aria-hidden="true">↗</span>
            </button>
            <button type="button" class="reader-button" aria-label="忽略上次阅读位置" @click="dismissResumePrompt">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
        </ClientOnly>
      </header>

      <div v-if="article" ref="articleContentRef" class="article-content">
        <ContentRenderer :value="article" />
      </div>
      <div
        v-else-if="isArticleMissing"
        class="app-card app-card-static rounded-none p-6 sm:p-8 lg:p-10"
        role="status"
        aria-live="polite"
      >
        <div class="flex flex-col gap-6">
          <div class="inline-flex w-fit items-center gap-2 text-xs text-muted">
            <UBadge variant="soft" color="primary" class="rounded-none text-xs font-medium">
              未找到
            </UBadge>
            <span>404</span>
          </div>
          <div class="space-y-3">
            <h1 class="text-2xl font-semibold leading-tight tracking-tight text-[var(--gh-fg-default)] sm:text-3xl">
              这篇文章暂时找不到
            </h1>
            <p class="max-w-2xl text-sm leading-7 text-muted sm:text-base">
              链接可能已经移动，或者文章尚未发布。回到归档后，可以用搜索或标签继续查找相关内容。
            </p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <UButton
              to="/"
              icon="i-lucide-archive"
              class="min-h-11 justify-center rounded-none"
              aria-label="回到文章归档继续浏览"
            >
              回到文章归档
            </UButton>
            <UButton
              to="/#article-search"
              variant="ghost"
              color="neutral"
              icon="i-lucide-search"
              class="min-h-11 justify-center rounded-none border border-[var(--surface-border)]/70"
              aria-label="回到文章归档并聚焦搜索"
            >
              搜索其他文章
            </UButton>
          </div>

          <ClientOnly>
            <RecentReadingPanel
              :items="recentItems"
              title="最近阅读"
              compact
              @clear="clearReadingHistory"
              @restore="restoreRecentReading"
            />
          </ClientOnly>
        </div>
      </div>

      <footer v-if="article" class="reader-ending" data-article-recovery>
        <div class="reader-tags" aria-label="文章标签">
          <NuxtLink v-for="tag in articleDetails?.tags" :key="tag" :to="{ path: '/', query: { tag }, hash: '#archive' }">
            # {{ tag }}
          </NuxtLink>
        </div>
        <nav v-if="previousArticle || nextArticle" class="reader-adjacent" aria-label="相邻文章">
          <NuxtLink v-if="previousArticle" :to="previousArticle.path" :aria-label="`上一篇：${previousArticle.title}`">
            <span>← 上一篇</span><strong>{{ previousArticle.title }}</strong>
          </NuxtLink>
          <NuxtLink v-if="nextArticle" :to="nextArticle.path" :aria-label="`下一篇：${nextArticle.title}`">
            <span>下一篇 →</span><strong>{{ nextArticle.title }}</strong>
          </NuxtLink>
        </nav>
        <div class="reader-ending__links">
          <NuxtLink to="/#archive">
            全部文章 ↗
          </NuxtLink><button type="button" class="reader-button" @click="scrollToTop">
            回到顶部 ↑
          </button>
        </div>
      </footer>
    </div>

    <aside v-if="article" class="reader-sidebar">
      <div class="reader-sidebar__sticky">
        <template v-if="hasToc">
          <p class="reader-sidebar__label">
            本文目录
          </p>
          <ArticleOutline :links="tocLinks" :active-id="activeHeadingId" @move="handleTocMove" />
        </template>
        <button type="button" class="reader-button reader-settings-trigger" aria-haspopup="dialog" @click="isSettingsOpen = true">
          <span class="reader-aa" aria-hidden="true">Aa</span>阅读设置
        </button>
        <button v-if="hasScrolled" type="button" class="reader-button" @click="scrollToTop">
          回到顶部 ↑
        </button>
      </div>
    </aside>

    <div v-if="article" class="reader-dock" :class="{ 'reader-dock--focus': preferences.focus }" role="group" aria-label="阅读工具">
      <button v-if="preferences.focus" type="button" class="reader-button" @click="changeReadingPreferences({ ...preferences, focus: false })">
        退出专注
      </button>
      <button v-if="hasToc" type="button" class="reader-button" aria-haspopup="dialog" :aria-expanded="isTocOpen" @click="isTocOpen = true">
        <UIcon name="i-lucide-list-tree" class="size-4" />目录
      </button>
      <button type="button" class="reader-button" aria-haspopup="dialog" :aria-expanded="isSettingsOpen" @click="isSettingsOpen = true">
        <span class="reader-aa" aria-hidden="true">Aa</span>阅读设置
      </button>
      <ThemeSwitcher />
    </div>
    <ReaderDialog v-model="isTocOpen" title="文章目录">
      <ArticleOutline :links="tocLinks" :active-id="activeHeadingId" @move="handleTocMove" />
    </ReaderDialog>
    <ArticleReadingSettings v-model="isSettingsOpen" :preferences="preferences" @change="changeReadingPreferences" />
  </div>
</template>
