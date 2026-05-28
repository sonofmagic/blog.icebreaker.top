<script setup lang="ts">
import type { MarkdownRoot } from '@nuxt/content'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ArticleTocList from '@/components/ArticleTocList.vue'
import RecentReadingPanel from '@/components/RecentReadingPanel.vue'

const route = useRoute()
const router = useRouter()
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

interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

function gatherNodeText(node: any): string {
  if (!node || typeof node !== 'object') {
    return ''
  }
  if (typeof node.value === 'string') {
    return node.value
  }
  if (Array.isArray(node.children)) {
    return node.children.map(
      child => gatherNodeText(child),
    ).join('')
  }
  return ''
}

function extractFirstParagraphText(body: any): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined
  }
  const nodes = Array.isArray(body.children) ? body.children : []
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const isParagraph = node.tag === 'p' || (node.type === 'element' && node.tag === 'p')
    if (isParagraph) {
      const text = gatherNodeText(node).trim()
      if (text) {
        return text.replace(/\s+/g, ' ')
      }
    }
  }
  return undefined
}

function buildTocLinksFromBody(body: MarkdownRoot | undefined | null): TocLink[] {
  const children = Array.isArray(body?.children) ? body!.children : []
  const links: TocLink[] = []
  const stack: Array<{ depth: number, link: TocLink }> = []

  for (const node of children) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const tag = typeof (node as any).tag === 'string' ? (node as any).tag : null
    if (!tag || !tag.startsWith('h')) {
      continue
    }

    const depth = Number.parseInt(tag.slice(1), 10)
    if (!Number.isFinite(depth) || depth < 2) {
      continue
    }

    const id = typeof (node as any).props?.id === 'string' ? (node as any).props.id : null
    if (!id) {
      continue
    }

    const text = gatherNodeText(node).trim()
    if (!text) {
      continue
    }

    const link: TocLink = {
      id,
      depth,
      text,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      links.push(link)
    }
    else {
      const parent = stack[stack.length - 1]!.link
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(link)
    }

    stack.push({ depth, link })
  }

  function normalize(nodes: TocLink[]): TocLink[] {
    return nodes.map((node) => {
      if (node.children && node.children.length === 0) {
        delete node.children
      }
      else if (node.children) {
        node.children = normalize(node.children)
      }
      return node
    })
  }

  return normalize(links)
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
const articleRecoveryRef = ref<HTMLElement | null>(null)
const tocDialogRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const hasScrolled = ref(false)
const isArticleRecoveryVisible = ref(false)
const activeHeadingId = ref<string | null>(null)
const shareState = ref<'idle' | 'copied' | 'shared' | 'printed' | 'failed'>('idle')
const resumePosition = ref<null | { scrollTop: number, progress: number }>(null)
const isResumePromptDismissed = ref(false)
let shareResetTimer: ReturnType<typeof setTimeout> | undefined
let savePositionTimer: ReturnType<typeof setTimeout> | undefined
let previousTocActiveElement: HTMLElement | null = null
let previousTocBodyOverflow = ''
let shouldRestoreTocFocus = true
let articleRecoveryObserver: IntersectionObserver | undefined
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

const activeHeadingLabel = computed(() => {
  if (!activeHeadingId.value) {
    return ''
  }
  return flatTocLinks.value.find(link => link.id === activeHeadingId.value)?.text ?? ''
})

const tocButtonLabel = computed(() => {
  if (isTocOpen.value) {
    return '收起目录'
  }
  return activeHeadingLabel.value ? `目录：${activeHeadingLabel.value}` : '目录'
})
const shouldShowMobileTocButton = computed(() => hasToc.value && (isTocOpen.value || !isArticleRecoveryVisible.value))

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

const primaryArticleTag = computed(() => articleDetails.value?.tags[0] ?? null)
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

const copyButtonLabel = computed(() => {
  if (shareState.value === 'copied') {
    return '已复制本文链接'
  }
  if (shareState.value === 'failed') {
    return '本文链接复制失败'
  }
  return '复制本文链接'
})

const shareButtonLabel = computed(() => {
  if (shareState.value === 'shared') {
    return '已打开系统分享'
  }
  if (shareState.value === 'copied') {
    return '已复制本文链接'
  }
  if (shareState.value === 'failed') {
    return '分享失败，已尝试复制链接'
  }
  return '分享本文'
})

const printButtonLabel = computed(() => {
  if (shareState.value === 'printed') {
    return '已打开打印'
  }
  return '打印本文'
})

const shareStatusLabel = computed(() => {
  if (shareState.value === 'shared') {
    return '已打开系统分享。'
  }
  if (shareState.value === 'copied') {
    return '已复制本文链接。'
  }
  if (shareState.value === 'printed') {
    return '已打开打印窗口。'
  }
  if (shareState.value === 'failed') {
    return '操作失败，请稍后重试。'
  }
  return ''
})

function scheduleReadingPositionSave(scrollTop: number, progress: number) {
  if (!import.meta.client) {
    return
  }

  const path = article.value?.path
  if (!path || progress < 2) {
    return
  }

  if (savePositionTimer) {
    clearTimeout(savePositionTimer)
  }
  savePositionTimer = setTimeout(() => {
    updateReadingPosition(path, scrollTop, progress)
  }, 350)
}

function updateActiveHeading() {
  if (!import.meta.client || !articleContentRef.value || tocLinks.value.length === 0) {
    activeHeadingId.value = null
    return
  }

  const headingIds = new Set(flatTocLinks.value.map(link => link.id))
  const headings = Array.from(articleContentRef.value.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]'))
    .filter(heading => headingIds.has(heading.id))

  if (headings.length === 0) {
    activeHeadingId.value = null
    return
  }

  const readingLine = Math.min(window.innerHeight * 0.38, 280)
  let currentHeading = headings[0]!

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= readingLine) {
      currentHeading = heading
    }
    else {
      break
    }
  }

  activeHeadingId.value = currentHeading.id
}

function updateReadingProgress() {
  if (!import.meta.client) {
    return
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const articleElement = articleContentRef.value
  if (articleElement) {
    const rect = articleElement.getBoundingClientRect()
    const articleTop = rect.top + scrollTop
    const articleHeight = articleElement.scrollHeight
    const start = Math.max(0, articleTop - 120)
    const end = Math.max(start + 1, articleTop + articleHeight - (window.innerHeight * 0.65))
    readingProgress.value = Math.min(100, Math.max(0, ((scrollTop - start) / (end - start)) * 100))
  }
  else {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    readingProgress.value = scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0
  }
  hasScrolled.value = scrollTop > 480
  updateActiveHeading()
  scheduleReadingPositionSave(scrollTop, readingProgress.value)
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

function scrollToResumePosition() {
  if (!import.meta.client || !resumePosition.value) {
    return
  }
  const scrollTop = resumePosition.value.scrollTop
  window.scrollTo({
    top: scrollTop,
    behavior: getPreferredScrollBehavior(),
  })
  isResumePromptDismissed.value = true
  focusNearestReadableBlock(scrollTop)
}

function dismissResumePrompt() {
  isResumePromptDismissed.value = true
}

function closeToc() {
  isTocOpen.value = false
}

function getTocFocusableElements() {
  if (!import.meta.client || !tocDialogRef.value) {
    return []
  }
  return Array.from(tocDialogRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ))
    .filter(element => !element.hasAttribute('disabled') && element.offsetParent !== null)
}

function handleTocKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeToc()
    return
  }

  if (event.key !== 'Tab' || !isTocOpen.value) {
    return
  }

  const focusableElements = getTocFocusableElements()
  if (focusableElements.length === 0) {
    event.preventDefault()
    tocDialogRef.value?.focus()
    return
  }

  const firstElement = focusableElements[0]!
  const lastElement = focusableElements[focusableElements.length - 1]!
  const activeElement = document.activeElement

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  }
  else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function scheduleShareStateReset() {
  if (shareResetTimer) {
    clearTimeout(shareResetTimer)
  }
  shareResetTimer = setTimeout(() => {
    shareState.value = 'idle'
  }, 2200)
}

async function writeCurrentUrlToClipboard() {
  if (!import.meta.client) {
    return false
  }

  const url = window.location.href
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    return true
  }
  catch {
    return false
  }
}

async function copyCurrentUrl() {
  shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
  scheduleShareStateReset()
}

async function shareCurrentArticle() {
  if (!import.meta.client) {
    return
  }

  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({
        title: articleTitle.value,
        text: articleDescription.value || articleTitle.value,
        url,
      })
      shareState.value = 'shared'
    }
    else {
      shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
    }
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      shareState.value = 'idle'
      return
    }
    shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
  }
  scheduleShareStateReset()
}

function printArticle() {
  if (!import.meta.client) {
    return
  }
  shareState.value = 'printed'
  window.print()
  scheduleShareStateReset()
}

function openTag(tag: string) {
  void router.push({ path: '/', query: { tag } })
}

function openPrimaryTagOrArchive() {
  if (primaryArticleTag.value) {
    openTag(primaryArticleTag.value)
    return
  }
  void router.push('/')
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

function setupArticleRecoveryObserver() {
  if (!import.meta.client) {
    return
  }

  articleRecoveryObserver?.disconnect()

  if (!articleRecoveryRef.value) {
    isArticleRecoveryVisible.value = false
    return
  }

  articleRecoveryObserver = new IntersectionObserver(
    ([entry]) => {
      isArticleRecoveryVisible.value = Boolean(entry?.isIntersecting)
    },
    {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.12,
    },
  )
  articleRecoveryObserver.observe(articleRecoveryRef.value)
}

onMounted(() => {
  updateReadingProgress()
  recordCurrentArticle()
  void nextTick(setupArticleRecoveryObserver)
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('resize', updateReadingProgress)
})

watch(
  () => article.value?.path,
  async () => {
    recordCurrentArticle()
    await nextTick()
    updateReadingProgress()
    setupArticleRecoveryObserver()
  },
)

watch(isTocOpen, async (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    shouldRestoreTocFocus = true
    previousTocActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousTocBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleTocKeydown)
    await nextTick()
    tocDialogRef.value?.querySelector<HTMLElement>('[aria-label="关闭目录"]')?.focus()
    return
  }

  document.body.style.overflow = previousTocBodyOverflow
  window.removeEventListener('keydown', handleTocKeydown)
  if (shouldRestoreTocFocus) {
    previousTocActiveElement?.focus()
  }
  shouldRestoreTocFocus = true
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }
  window.removeEventListener('scroll', updateReadingProgress)
  window.removeEventListener('resize', updateReadingProgress)
  window.removeEventListener('keydown', handleTocKeydown)
  articleRecoveryObserver?.disconnect()
  document.body.style.overflow = previousTocBodyOverflow
  if (shareResetTimer) {
    clearTimeout(shareResetTimer)
  }
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

const tocUi = {
  root: 'lg:w-full lg:!border-none lg:!shadow-none',
  container: 'lg:gap-3',
  content: 'lg:flex lg:flex-col lg:gap-1.5 lg:!overflow-visible',
  list: 'space-y-1 text-sm text-muted leading-relaxed',
  listWithChildren: 'mt-2 space-y-1 border-l border-[--surface-border]/60 pl-3',
  item: 'max-w-full overflow-hidden',
  itemWithChildren: 'max-w-full overflow-hidden',
  link: 'group flex min-h-11 max-w-full items-start rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[--panel-bg-soft] hover:text-[--gh-accent-emphasis] lg:min-h-0 lg:py-1.5',
  linkText: 'line-clamp-2 min-w-0 break-words text-left group-focus-visible:line-clamp-none group-hover:line-clamp-none',
  activeLink: 'bg-[--gh-accent-subtle] text-[--gh-accent-emphasis] font-medium',
  indicator: 'bg-[--gh-accent-subtle]',
}

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

function handleTocMove(id?: string) {
  if (isTocOpen.value) {
    shouldRestoreTocFocus = false
    closeToc()
    window.setTimeout(() => {
      focusHeadingAfterTocMove(id)
    }, 50)
    return
  }

  focusHeadingAfterTocMove(id)
}
</script>

<template>
  <div class="relative flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
    <div class="article-reading-progress fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        role="progressbar"
        aria-label="顶部文章阅读进度"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(readingProgress)"
        class="h-full bg-[--gh-accent-emphasis] transition-[width] duration-150 ease-out"
        :style="{ width: `${readingProgress}%` }"
      />
    </div>

    <div class="flex flex-col gap-6">
      <UButton
        to="/"
        variant="ghost"
        icon="i-lucide-arrow-left"
        class="min-h-11 w-fit rounded-full border border-transparent px-4 py-2 text-sm"
        aria-label="回到文章归档"
      >
        返回归档
      </UButton>

      <div
        v-if="articleDetails"
        class="article-utility-strip rounded-3xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)] sm:px-5"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[--panel-bg-soft] px-3 py-1.5">
              <UIcon name="i-lucide-calendar-days" class="size-4 text-[--gh-accent-emphasis]" />
              {{ articleDetails.date }}
            </span>
            <span
              v-for="meta in articleDetails.readingMeta"
              :key="meta"
              class="inline-flex items-center gap-1.5 rounded-full bg-[--panel-bg-soft] px-3 py-1.5"
            >
              <UIcon name="i-lucide-book-open-check" class="size-4 text-[--gh-accent-emphasis]" />
              {{ meta }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="tag in articleDetails.tags"
              :key="tag"
              type="button"
              class="inline-flex min-h-11 items-center rounded-full border border-[--surface-border]/70 bg-[--panel-bg-soft] px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-[--gh-accent-emphasis]/70 hover:text-[--gh-accent-emphasis]"
              :aria-label="`查看标签「${tag}」下的文章`"
              @click="openTag(tag)"
            >
              {{ tag }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[--surface-border]/70 bg-[--panel-bg-soft] px-3 py-2 text-xs font-medium text-[--gh-accent-emphasis] transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle]"
              :aria-label="shareButtonLabel"
              @click="shareCurrentArticle"
            >
              <UIcon :name="shareState === 'shared' ? 'i-lucide-check' : 'i-lucide-share-2'" class="size-4" />
              {{ shareButtonLabel }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[--surface-border]/70 bg-[--panel-bg-soft] px-3 py-2 text-xs font-medium text-[--gh-accent-emphasis] transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle]"
              :aria-label="copyButtonLabel"
              @click="copyCurrentUrl"
            >
              <UIcon :name="shareState === 'copied' ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
              {{ copyButtonLabel }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[--surface-border]/70 bg-[--panel-bg-soft] px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle] hover:text-[--gh-accent-emphasis]"
              :aria-label="printButtonLabel"
              @click="printArticle"
            >
              <UIcon name="i-lucide-printer" class="size-4" />
              {{ printButtonLabel }}
            </button>
            <span
              v-if="shareState !== 'idle'"
              class="sr-only"
              role="status"
            >
              {{ shareStatusLabel }}
            </span>
          </div>
        </div>
      </div>

      <ClientOnly>
        <div
          v-if="shouldShowResumePrompt"
          class="article-resume-prompt flex flex-col gap-3 rounded-2xl border border-[--gh-accent-emphasis]/30 bg-[--gh-accent-subtle] px-4 py-4 text-sm text-[--gh-accent-emphasis] sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div class="inline-flex items-start gap-2 leading-6">
            <UIcon name="i-lucide-book-marked" class="mt-0.5 size-4 shrink-0" />
            <span>{{ resumePromptText }}，可以从上次离开的地方继续。</span>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-[--gh-accent-emphasis]/40 bg-[--panel-bg] px-4 py-2 text-sm font-medium transition-colors hover:border-[--gh-accent-emphasis] hover:bg-[--gh-accent-subtle]"
              @click="scrollToResumePosition"
            >
              继续阅读
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-[--panel-bg] hover:text-[--gh-accent-emphasis]"
              @click="dismissResumePrompt"
            >
              稍后再说
            </button>
          </div>
        </div>
      </ClientOnly>

      <header
        v-if="article"
        class="article-hero rounded-3xl border border-[--surface-border]/60 bg-[--panel-bg] px-5 py-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)] sm:px-7 sm:py-8"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-[--gh-accent-emphasis]">
          Article
        </p>
        <h1 class="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[--gh-fg-default] sm:text-4xl lg:text-5xl">
          {{ articleTitle }}
        </h1>
        <p
          v-if="articleDescription"
          class="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base"
        >
          {{ articleDescription }}
        </p>
      </header>

      <div v-if="article" ref="articleContentRef" class="article-content">
        <ContentRenderer :value="article" />
      </div>

      <div
        v-else-if="isArticleMissing"
        class="app-card app-card-static rounded-3xl p-6 sm:p-8 lg:p-10"
        role="status"
        aria-live="polite"
      >
        <div class="flex flex-col gap-6">
          <div class="inline-flex w-fit items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted">
            <UBadge variant="soft" color="primary" class="text-[0.65rem] uppercase tracking-[0.25em]">
              Not found
            </UBadge>
            <span>404</span>
          </div>
          <div class="space-y-3">
            <h1 class="text-2xl font-semibold leading-tight tracking-tight text-[--gh-fg-default] sm:text-3xl">
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
              class="min-h-11 justify-center rounded-full"
              aria-label="回到文章归档继续浏览"
            >
              回到文章归档
            </UButton>
            <UButton
              to="/#article-search"
              variant="ghost"
              color="neutral"
              icon="i-lucide-search"
              class="min-h-11 justify-center rounded-full border border-[--surface-border]/70"
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
              @restore="restoreReadingHistory"
            />
          </ClientOnly>
        </div>
      </div>

      <UAlert
        v-else
        color="primary"
        variant="soft"
        icon="i-lucide-loader-2"
        class="animate-pulse text-sm sm:text-base"
        role="status"
        aria-live="polite"
      >
        正在加载文章…
      </UAlert>

      <div
        v-if="article"
        ref="articleRecoveryRef"
        class="mt-10 space-y-5 border-t border-[--surface-border]/60 pt-6"
        data-article-recovery
      >
        <div
          v-if="previousArticle || nextArticle"
          class="grid gap-4 sm:grid-cols-2"
        >
          <ULink
            v-if="previousArticle"
            :to="previousArticle.path"
            class="group flex min-h-32 flex-col justify-between gap-4 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-4 transition-colors hover:border-[--gh-accent-emphasis]/60 hover:bg-[--panel-bg-soft]"
            :aria-label="`上一篇：${previousArticle.title}`"
          >
            <span class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted/70">
              <UIcon name="i-lucide-arrow-left" class="size-4" />
              上一篇
            </span>
            <span class="text-sm font-semibold leading-snug text-[--gh-fg-default] group-hover:text-[--gh-accent-emphasis]">
              {{ previousArticle.title }}
            </span>
          </ULink>

          <ULink
            v-if="nextArticle"
            :to="nextArticle.path"
            class="group flex min-h-32 flex-col justify-between gap-4 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-4 text-left transition-colors hover:border-[--gh-accent-emphasis]/60 hover:bg-[--panel-bg-soft] sm:text-right"
            :aria-label="`下一篇：${nextArticle.title}`"
          >
            <span class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted/70 sm:justify-end">
              下一篇
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </span>
            <span class="text-sm font-semibold leading-snug text-[--gh-fg-default] group-hover:text-[--gh-accent-emphasis]">
              {{ nextArticle.title }}
            </span>
          </ULink>
        </div>

        <section class="rounded-3xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)] sm:px-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-1">
              <p class="text-xs uppercase tracking-[0.3em] text-muted/70">
                Continue
              </p>
              <h2 class="text-base font-semibold text-[--gh-fg-default]">
                继续浏览相关笔记
              </h2>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <UButton
                variant="soft"
                color="primary"
                icon="i-lucide-tags"
                size="lg"
                class="min-h-11 justify-center rounded-full"
                :aria-label="primaryArticleTag ? `查看标签「${primaryArticleTag}」下的文章` : '回到文章归档'"
                @click="openPrimaryTagOrArchive"
              >
                {{ primaryArticleTag ? `查看 ${primaryArticleTag}` : '回到归档' }}
              </UButton>
              <UButton
                to="/#article-search"
                variant="ghost"
                color="neutral"
                icon="i-lucide-search"
                size="lg"
                class="min-h-11 justify-center rounded-full border border-[--surface-border]/70"
                aria-label="到文章归档搜索文章"
              >
                搜索文章
              </UButton>
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-lucide-arrow-up"
                size="lg"
                class="min-h-11 justify-center rounded-full border border-[--surface-border]/70"
                aria-label="回到文章顶部"
                @click="scrollToTop"
              >
                回到顶部
              </UButton>
            </div>
          </div>
        </section>
      </div>
    </div>

    <aside
      v-if="hasToc"
      class="sticky top-32 hidden h-fit max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-[--surface-border]/60 bg-[--panel-bg] p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] lg:block"
      aria-labelledby="article-toc-title"
    >
      <div class="text-[0.65rem] uppercase tracking-[0.3em] text-muted/60">
        Contents
      </div>
      <h2 id="article-toc-title" class="mt-2 text-sm font-semibold tracking-wide text-muted-strong">
        文章目录
      </h2>
      <p
        v-if="activeHeadingLabel"
        class="mt-2 line-clamp-2 text-xs leading-5 text-[--gh-accent-emphasis]"
      >
        正在阅读：{{ activeHeadingLabel }}
      </p>
      <div class="mt-4 -mr-2 pr-2">
        <ArticleTocList :links="tocLinks" :toc-ui="tocUi" :active-id="activeHeadingId" @move="handleTocMove" />
      </div>
      <div class="mt-5 border-t border-[--surface-border]/60 pt-4">
        <div class="flex items-center justify-between text-xs text-muted">
          <span>阅读进度</span>
          <span>{{ Math.round(readingProgress) }}%</span>
        </div>
        <div
          class="mt-2 h-1.5 overflow-hidden rounded-full bg-[--panel-bg-soft]"
          role="progressbar"
          aria-label="侧边目录文章阅读进度"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(readingProgress)"
        >
          <div
            class="h-full rounded-full bg-[--gh-accent-emphasis] transition-[width] duration-150"
            :style="{ width: `${readingProgress}%` }"
          />
        </div>
      </div>
    </aside>

    <ClientOnly>
      <button
        v-if="hasScrolled"
        type="button"
        class="fixed bottom-5 right-5 z-40 hidden size-11 items-center justify-center rounded-full border border-[--surface-border]/70 bg-[--panel-bg] text-muted shadow-[0_18px_45px_-26px_rgba(15,23,42,0.55)] backdrop-blur transition-colors hover:border-[--gh-accent-emphasis]/70 hover:text-[--gh-accent-emphasis] lg:inline-flex"
        aria-label="返回文章顶部"
        @click="scrollToTop"
      >
        <UIcon name="i-lucide-arrow-up" class="size-5" />
      </button>
    </ClientOnly>

    <div v-if="shouldShowMobileTocButton" class="article-mobile-toc pointer-events-none lg:hidden">
      <div class="article-mobile-toc__button fixed z-40 pointer-events-auto">
        <UButton
          class="pointer-events-auto min-h-11 min-w-11 rounded-full border border-[--gh-accent-emphasis]/60 bg-[--gh-accent-subtle] px-3 py-2 text-sm font-medium text-[--gh-accent-emphasis] shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur transition-colors duration-150 hover:border-[--gh-accent-emphasis] hover:bg-[rgba(31,111,235,0.18)] hover:text-[--gh-accent-emphasis] dark:hover:bg-[rgba(65,132,228,0.26)]"
          size="sm"
          :icon="isTocOpen ? 'i-lucide-x' : 'i-lucide-list-tree'"
          :aria-label="tocButtonLabel"
          :aria-expanded="isTocOpen"
          aria-controls="mobile-article-toc"
          @click="isTocOpen = !isTocOpen"
        >
          <span class="sr-only">{{ isTocOpen ? '收起目录' : '目录' }}</span>
        </UButton>
      </div>

      <div
        v-if="isTocOpen"
        id="mobile-article-toc"
        ref="tocDialogRef"
        class="fixed inset-0 z-30 flex flex-col justify-end bg-black/60 backdrop-blur-sm pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-toc-title"
        tabindex="-1"
        @click.self="closeToc"
      >
        <div class="article-mobile-toc__panel mx-auto w-[min(100%-2.5rem,28rem)] max-h-[70vh] overflow-y-auto rounded-3xl border border-[--surface-border]/80 bg-[--panel-bg] p-5 shadow-[0_24px_60px_-25px_rgba(15,23,42,0.6)] pointer-events-auto">
          <div class="mb-4 flex items-center justify-between">
            <div class="min-w-0">
              <p id="mobile-toc-title" class="text-sm font-semibold text-muted-strong">
                文章目录
              </p>
              <p
                v-if="activeHeadingLabel"
                class="mt-1 line-clamp-2 text-xs leading-5 text-[--gh-accent-emphasis]"
              >
                正在阅读：{{ activeHeadingLabel }}
              </p>
            </div>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              class="size-11 rounded-full !px-0 !py-0 flex items-center justify-center text-muted"
              aria-label="关闭目录"
              @click="closeToc"
            />
          </div>
          <div>
            <ArticleTocList :links="tocLinks" :toc-ui="tocUi" :active-id="activeHeadingId" @move="handleTocMove" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-mobile-toc__button {
  bottom: max(1.25rem, env(safe-area-inset-bottom));
  right: max(1rem, env(safe-area-inset-right));
}

.article-mobile-toc__panel {
  margin-bottom: max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem));
}
</style>
