<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ArticleCard from '@/components/ArticleCard.vue'
import RecentReadingPanel from '@/components/RecentReadingPanel.vue'

definePageMeta({
  alias: ['/articles'],
})

const route = useRoute()
const router = useRouter()
const { recentItems, clearReadingHistory, restoreReadingHistory } = useReadingHistory()

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

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapToSummary(entry: Record<string, any>) {
  return {
    path: (typeof entry.path === 'string' && entry.path) || '/',
    title: typeof entry.title === 'string' && entry.title.length > 0 ? entry.title : 'Untitled',
    description: typeof entry.description === 'string' ? cleanInlineMarkdown(entry.description) : undefined,
    date: typeof entry.date === 'string' ? entry.date : undefined,
    tags: Array.isArray(entry.tags) ? entry.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
    readingMinutes: typeof entry.readingMinutes === 'number' ? entry.readingMinutes : undefined,
    readingWords: typeof entry.readingWords === 'number' ? entry.readingWords : undefined,
  }
}

const { data, pending, error } = await useAsyncData('articles:home', async () => {
  const entries = await queryCollection('articles').all()
  const articleEntries = Array.isArray(entries) ? entries : []

  const summaries = articleEntries
    .map(entry => ({ ...entry, ...parseMeta(entry) }))
    .filter(entry => entry.draft !== true)
    .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
    .map(mapToSummary)

  const total = summaries.length

  return summaries.map((summary, index) => ({
    ...summary,
    rank: total - index,
  }))
})

const articles = computed(() => data.value || [])
const totalArticleCount = computed(() => articles.value.length)

const tagFrequency = computed(() => {
  const counter = new Map<string, number>()
  for (const article of articles.value) {
    for (const tag of article.tags || []) {
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  return counter
})

const allTags = computed(() => Array.from(tagFrequency.value.entries())
  .map(([label, count]) => ({ label, count }))
  .sort((a, b) => {
    const countDiff = b.count - a.count
    if (countDiff !== 0) {
      return countDiff
    }
    return a.label < b.label ? -1 : a.label > b.label ? 1 : 0
  }))

function getArticleYear(date?: string) {
  if (!date) {
    return null
  }
  const year = date.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}

const yearFrequency = computed(() => {
  const counter = new Map<string, number>()
  for (const article of articles.value) {
    const year = getArticleYear(article.date)
    if (year) {
      counter.set(year, (counter.get(year) || 0) + 1)
    }
  }
  return counter
})

const allYears = computed(() => Array.from(yearFrequency.value.entries())
  .map(([label, count]) => ({ label, count }))
  .sort((a, b) => Number(b.label) - Number(a.label)))

function readQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : ''
  }
  return typeof value === 'string' ? value : ''
}

const initialTag = readQueryValue(route.query.tag)
const initialSearch = readQueryValue(route.query.q)
const initialYear = readQueryValue(route.query.year)
const activeTag = ref<string | null>(initialTag || null)
const activeYear = ref<string | null>(yearFrequency.value.has(initialYear) ? initialYear : null)
const searchQuery = ref(initialSearch)

const normalizedSearchQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase())

const filteredArticles = computed(() => {
  const query = normalizedSearchQuery.value
  return articles.value.filter((article) => {
    const matchesTag = !activeTag.value || article.tags.includes(activeTag.value)
    if (!matchesTag) {
      return false
    }
    const matchesYear = !activeYear.value || getArticleYear(article.date) === activeYear.value
    if (!matchesYear) {
      return false
    }
    if (!query) {
      return true
    }
    const searchableText = [
      article.title,
      article.description,
      article.date,
      ...article.tags,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLocaleLowerCase()
    return searchableText.includes(query)
  })
})

const filteredArticleCount = computed(() => filteredArticles.value.length)
const recentArticles = computed(() => {
  const articleByPath = new Map(articles.value.map(article => [article.path, article]))
  return recentItems.value
    .map((historyItem) => {
      const article = articleByPath.get(historyItem.path)
      return article
        ? {
            ...historyItem,
            title: article.title,
            date: article.date ?? historyItem.date,
            tags: article.tags,
            readingMinutes: article.readingMinutes,
            readingWords: article.readingWords,
            progress: historyItem.progress,
          }
        : historyItem
    })
    .filter(item => articleByPath.has(item.path))
})

const MAX_VISIBLE_TAGS = 10
const showAllTags = ref(false)

const visibleTags = computed(() => {
  if (showAllTags.value) {
    return allTags.value
  }
  return allTags.value.slice(0, MAX_VISIBLE_TAGS)
})

const hiddenTagCount = computed(() => Math.max(allTags.value.length - MAX_VISIBLE_TAGS, 0))

const INITIAL_ARTICLE_LIMIT = 18
const ARTICLE_BATCH_SIZE = 18
const visibleArticleLimit = ref(INITIAL_ARTICLE_LIMIT)
const focusedArticlePath = ref<string | null>(null)
const isSearchTargeted = ref(false)
const copyFilterState = ref<'idle' | 'copied' | 'failed'>('idle')
const searchInputRef = ref<HTMLInputElement | null>(null)
const resultsSummaryRef = ref<HTMLElement | null>(null)
let focusedArticleTimer: ReturnType<typeof setTimeout> | undefined
let searchTargetTimer: ReturnType<typeof setTimeout> | undefined
let copyFilterResetTimer: ReturnType<typeof setTimeout> | undefined

const visibleArticles = computed(() => filteredArticles.value.slice(0, visibleArticleLimit.value))
const hiddenArticleCount = computed(() => Math.max(filteredArticles.value.length - visibleArticles.value.length, 0))
const hasMoreArticles = computed(() => hiddenArticleCount.value > 0)
const isEmpty = computed(() => !pending.value && !error.value && filteredArticles.value.length === 0)
const hasActiveFilters = computed(() => Boolean(activeTag.value || activeYear.value || normalizedSearchQuery.value))
const firstVisibleArticle = computed(() => visibleArticles.value[0] ?? null)

const resultSummary = computed(() => {
  const parts: string[] = []
  if (activeTag.value) {
    parts.push(`标签「${activeTag.value}」`)
  }
  if (activeYear.value) {
    parts.push(`${activeYear.value} 年`)
  }
  if (normalizedSearchQuery.value) {
    parts.push(`关键词「${searchQuery.value.trim()}」`)
  }
  if (parts.length === 0) {
    return `共 ${totalArticleCount.value} 篇文章`
  }
  return `${parts.join(' + ')}，找到 ${filteredArticleCount.value} 篇`
})

const activeFilterChips = computed(() => {
  const chips: Array<{ key: 'tag' | 'year' | 'search', label: string, value: string, removeLabel: string }> = []
  if (activeTag.value) {
    chips.push({
      key: 'tag',
      label: '标签',
      value: activeTag.value,
      removeLabel: `移除标签筛选：${activeTag.value}`,
    })
  }
  if (activeYear.value) {
    chips.push({
      key: 'year',
      label: '年份',
      value: activeYear.value,
      removeLabel: `移除年份筛选：${activeYear.value}`,
    })
  }
  const query = searchQuery.value.trim()
  if (query) {
    chips.push({
      key: 'search',
      label: '关键词',
      value: query,
      removeLabel: `移除关键词筛选：${query}`,
    })
  }
  return chips
})

const copyFilterLabel = computed(() => {
  if (copyFilterState.value === 'copied') {
    return '已复制筛选视图链接'
  }
  if (copyFilterState.value === 'failed') {
    return '筛选视图链接复制失败'
  }
  return '复制筛选视图链接'
})

watch(
  [activeTag, activeYear, normalizedSearchQuery],
  ([tag, year, query]) => {
    const nextQuery = { ...route.query }

    if (tag) {
      nextQuery.tag = tag
    }
    else {
      delete nextQuery.tag
    }

    if (year) {
      nextQuery.year = year
    }
    else {
      delete nextQuery.year
    }

    if (query) {
      nextQuery.q = searchQuery.value.trim()
    }
    else {
      delete nextQuery.q
    }

    const currentTag = readQueryValue(route.query.tag)
    const currentYear = readQueryValue(route.query.year)
    const currentSearch = readQueryValue(route.query.q).trim()
    if ((tag || '') === currentTag && (year || '') === currentYear && (query || '') === currentSearch.toLocaleLowerCase()) {
      return
    }

    router.replace({ query: nextQuery })
  },
)

watch(
  () => route.query,
  (query) => {
    const nextTag = readQueryValue(query.tag) || null
    const nextYear = readQueryValue(query.year) || null
    const nextSearch = readQueryValue(query.q)
    if (activeTag.value !== nextTag) {
      activeTag.value = nextTag
    }
    if (activeYear.value !== nextYear) {
      activeYear.value = yearFrequency.value.has(nextYear ?? '') ? nextYear : null
    }
    if (searchQuery.value !== nextSearch) {
      searchQuery.value = nextSearch
    }
  },
)

watch([activeTag, activeYear, normalizedSearchQuery], () => {
  visibleArticleLimit.value = INITIAL_ARTICLE_LIMIT
})

watch(activeTag, () => {
  if (activeTag.value && !showAllTags.value) {
    const tagInVisible = visibleTags.value.some(tag => tag.label === activeTag.value)
    if (!tagInVisible) {
      showAllTags.value = true
    }
  }
}, { immediate: true })

watch(hiddenTagCount, (count) => {
  if (count === 0) {
    showAllTags.value = false
  }
})

watch(
  () => route.hash,
  async (hash) => {
    if (!import.meta.client || hash !== '#article-search') {
      return
    }

    await nextTick()
    window.requestAnimationFrame(() => {
      const searchInput = document.getElementById('article-search') as HTMLInputElement | null
      searchInput?.focus({ preventScroll: true })
      isSearchTargeted.value = true

      if (searchTargetTimer) {
        clearTimeout(searchTargetTimer)
      }
      searchTargetTimer = setTimeout(() => {
        isSearchTargeted.value = false
      }, 1600)
    })
  },
  { immediate: true },
)

useSiteSeo(() => ({
  title: '文章归档',
  description: `icebreaker 的实验笔记与文章合集，当前收录 ${totalArticleCount.value} 篇，覆盖 ${allTags.value.length} 个主题标签。`,
  type: 'website',
}))

const tagButtonBaseClass = [
  'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium tracking-[0.02em]',
  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/30 focus-visible:ring-offset-2',
].join(' ')

const tagButtonActiveClass = [
  'border-[--gh-accent-emphasis] bg-[--gh-accent-subtle] text-[--gh-accent-emphasis] shadow-[0_12px_30px_-18px_rgba(31,111,235,0.35)]',
  'hover:border-[--gh-accent-emphasis] hover:bg-[rgba(31,111,235,0.18)] hover:text-[--gh-accent-emphasis] dark:hover:bg-[rgba(65,132,228,0.26)]',
  'focus-visible:ring-offset-[--panel-bg] dark:focus-visible:ring-offset-[--panel-bg]',
].join(' ')

const tagButtonInactiveClass = [
  'border-[--surface-border]/70 bg-[--panel-bg] text-muted',
  'hover:bg-[--panel-bg-soft] hover:border-[--surface-border]/40 hover:text-[--gh-accent-emphasis]',
  'focus-visible:ring-offset-[--panel-bg]',
].join(' ')

const tagBadgeBaseClass = 'inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[0.65rem] tracking-[0.08em] transition-colors duration-150'

const tagBadgeActiveClass = 'bg-[rgba(31,111,235,0.18)] text-[--gh-accent-emphasis] dark:bg-[rgba(65,132,228,0.24)] dark:text-[--gh-accent-emphasis]'

const tagBadgeInactiveClass = 'bg-slate-400/10 text-muted'

async function focusResultsSummary() {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  window.requestAnimationFrame(() => {
    resultsSummaryRef.value?.focus({ preventScroll: true })
  })
}

async function focusSearchInput() {
  if (!import.meta.client) {
    return
  }

  await nextTick()
  window.requestAnimationFrame(() => {
    searchInputRef.value?.focus({ preventScroll: true })
  })
}

function getPreferredScrollBehavior(): ScrollBehavior {
  if (!import.meta.client) {
    return 'auto'
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function toggleTag(tag: string | null) {
  if (!tag) {
    activeTag.value = null
    void focusResultsSummary()
    return
  }
  activeTag.value = activeTag.value === tag ? null : tag
  void focusResultsSummary()
}

function toggleYear(year: string | null) {
  if (!year) {
    activeYear.value = null
    void focusResultsSummary()
    return
  }
  activeYear.value = activeYear.value === year ? null : year
  void focusResultsSummary()
}

function handleFilterGroupKeydown(event: KeyboardEvent, groupSelector: string) {
  if (!import.meta.client) {
    return
  }

  const navigationKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!navigationKeys.includes(event.key)) {
    return
  }

  const current = event.target
  if (!(current instanceof HTMLElement)) {
    return
  }

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(`${groupSelector} button:not([disabled])`))
  const currentIndex = buttons.indexOf(current as HTMLButtonElement)
  if (currentIndex === -1) {
    return
  }

  event.preventDefault()

  let nextIndex = currentIndex
  if (event.key === 'ArrowLeft') {
    nextIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1
  }
  else if (event.key === 'ArrowRight') {
    nextIndex = currentIndex === buttons.length - 1 ? 0 : currentIndex + 1
  }
  else if (event.key === 'Home') {
    nextIndex = 0
  }
  else if (event.key === 'End') {
    nextIndex = buttons.length - 1
  }

  const nextButton = buttons[nextIndex]
  nextButton?.focus({ preventScroll: true })
  nextButton?.scrollIntoView({
    behavior: getPreferredScrollBehavior(),
    block: 'nearest',
    inline: 'nearest',
  })
}

function handleTagGroupKeydown(event: KeyboardEvent) {
  handleFilterGroupKeydown(event, '[data-filter-group="tags"]')
}

function handleYearGroupKeydown(event: KeyboardEvent) {
  handleFilterGroupKeydown(event, '[data-filter-group="years"]')
}

function scrollToArchiveControls() {
  if (!import.meta.client) {
    return
  }
  window.requestAnimationFrame(() => {
    document.getElementById('archive-controls')?.scrollIntoView({
      behavior: getPreferredScrollBehavior(),
      block: 'start',
    })
  })
}

function selectCardTag(tag: string) {
  activeTag.value = tag
  if (!showAllTags.value) {
    const tagInVisible = visibleTags.value.some(visibleTag => visibleTag.label === tag)
    if (!tagInVisible) {
      showAllTags.value = true
    }
  }
  scrollToArchiveControls()
  void focusResultsSummary()
}

function toggleTagVisibility() {
  const nextState = !showAllTags.value
  if (!nextState && activeTag.value) {
    const stillVisible = allTags.value.slice(0, MAX_VISIBLE_TAGS).some(tag => tag.label === activeTag.value)
    if (!stillVisible) {
      activeTag.value = null
    }
  }
  showAllTags.value = nextState
}

function clearSearch() {
  searchQuery.value = ''
  void focusSearchInput()
}

function removeFilterChip(key: 'tag' | 'year' | 'search') {
  if (key === 'tag') {
    activeTag.value = null
    void focusResultsSummary()
    return
  }
  if (key === 'year') {
    activeYear.value = null
    void focusResultsSummary()
    return
  }
  searchQuery.value = ''
  void focusResultsSummary()
}

function clearFilters() {
  activeTag.value = null
  activeYear.value = null
  searchQuery.value = ''
  showAllTags.value = false
  void focusResultsSummary()
}

function scheduleCopyFilterReset() {
  if (copyFilterResetTimer) {
    clearTimeout(copyFilterResetTimer)
  }
  copyFilterResetTimer = setTimeout(() => {
    copyFilterState.value = 'idle'
  }, 2200)
}

async function copyCurrentArchiveView() {
  if (!import.meta.client) {
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = window.location.href
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copyFilterState.value = 'copied'
  }
  catch {
    copyFilterState.value = 'failed'
  }
  scheduleCopyFilterReset()
}

async function openFirstResult() {
  await nextTick()
  if (!firstVisibleArticle.value) {
    return
  }
  void router.push(firstVisibleArticle.value.path)
}

async function loadMoreArticles() {
  const previousLimit = visibleArticleLimit.value
  visibleArticleLimit.value += ARTICLE_BATCH_SIZE

  if (!import.meta.client) {
    return
  }

  await nextTick()
  const nextArticle = visibleArticles.value[previousLimit]
  if (!nextArticle) {
    return
  }

  focusedArticlePath.value = nextArticle.path
  if (focusedArticleTimer) {
    clearTimeout(focusedArticleTimer)
  }
  focusedArticleTimer = setTimeout(() => {
    focusedArticlePath.value = null
  }, 1400)

  const nextCard = document.querySelector<HTMLElement>(`[data-article-path="${nextArticle.path}"] a`)
  nextCard?.focus({ preventScroll: true })
}

onBeforeUnmount(() => {
  if (focusedArticleTimer) {
    clearTimeout(focusedArticleTimer)
  }
  if (copyFilterResetTimer) {
    clearTimeout(copyFilterResetTimer)
  }
  if (searchTargetTimer) {
    clearTimeout(searchTargetTimer)
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 lg:gap-8">
    <div class="app-card app-card-static rounded-3xl p-4 sm:p-6 lg:p-8">
      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.48fr)] lg:items-end">
        <div class="space-y-4">
          <div class="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted">
            <UBadge variant="soft" color="primary" class="text-[0.65rem] uppercase tracking-[0.25em]">
              Archive
            </UBadge>
            <span class="text-muted/80">{{ totalArticleCount }} posts</span>
          </div>
          <div class="space-y-3">
            <h1 class="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[--gh-fg-default] sm:text-4xl lg:text-5xl">
              文章归档
            </h1>
            <p class="max-w-2xl text-sm leading-7 text-muted sm:text-base">
              按主题和关键词快速找到技术笔记、项目复盘与日常记录。
            </p>
          </div>
        </div>
        <form
          class="rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] p-3 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] transition-[border-color,box-shadow] duration-200"
          :class="isSearchTargeted ? 'border-[--gh-accent-emphasis]/70 shadow-[0_0_0_4px_rgba(31,111,235,0.14),0_18px_45px_-32px_rgba(15,23,42,0.45)] dark:shadow-[0_0_0_4px_rgba(65,132,228,0.18),0_18px_45px_-32px_rgba(15,23,42,0.45)]' : ''"
          role="search"
          @submit.prevent="openFirstResult"
        >
          <label for="article-search" class="mb-2 block text-[0.65rem] uppercase tracking-[0.28em] text-muted/70">
            搜索文章
          </label>
          <div class="flex min-h-11 items-center gap-2 rounded-xl border border-[--surface-border]/70 bg-[--panel-bg-soft] px-3 py-1.5 transition-colors focus-within:border-[--gh-accent-emphasis]/70">
            <UIcon name="i-lucide-search" class="size-4 shrink-0 text-muted" />
            <input
              id="article-search"
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              name="q"
              aria-controls="article-results"
              aria-describedby="archive-search-feedback"
              class="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-[--gh-fg-default] outline-none placeholder:text-muted/60"
              placeholder="标题、简介、标签"
              autocomplete="off"
              @keydown.enter.prevent="openFirstResult"
            >
            <button
              type="submit"
              class="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[--surface-border]/70 bg-[--panel-bg] text-muted transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle] hover:text-[--gh-accent-emphasis] focus-visible:bg-[--gh-accent-subtle] focus-visible:text-[--gh-accent-emphasis] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!firstVisibleArticle"
              :aria-label="firstVisibleArticle ? `打开第一篇匹配文章：${firstVisibleArticle.title}` : '没有可打开的匹配文章'"
              aria-controls="article-results"
            >
              <UIcon name="i-lucide-corner-down-right" class="size-4" />
            </button>
            <button
              v-if="searchQuery"
              type="button"
              class="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-[--panel-bg] hover:text-[--gh-accent-emphasis] focus-visible:bg-[--panel-bg] focus-visible:text-[--gh-accent-emphasis] focus-visible:outline-none"
              aria-label="清空搜索"
              aria-controls="article-results"
              @click="clearSearch"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
          <p id="archive-search-feedback" class="mt-2 text-xs leading-5 text-muted">
            {{ resultSummary }}
          </p>
        </form>
      </section>
      <p class="sr-only" aria-live="polite">
        {{ resultSummary }}{{ firstVisibleArticle ? `，第一篇是 ${firstVisibleArticle.title}` : '' }}
      </p>

      <ClientOnly>
        <RecentReadingPanel
          v-if="!hasActiveFilters"
          class="mt-8"
          :items="recentArticles"
          @clear="clearReadingHistory"
          @restore="restoreReadingHistory"
        />
      </ClientOnly>

      <div class="mt-8 space-y-6">
        <div
          id="archive-controls"
          class="scroll-mt-28 space-y-2 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-3 py-3 sm:px-4 sm:py-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="text-[0.65rem] uppercase tracking-[0.3em] text-muted/70">按标签浏览</span>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="hasActiveFilters"
                type="button"
                class="inline-flex min-h-11 items-center gap-2 rounded-full border border-[--surface-border]/70 bg-[--panel-bg-soft] px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-200 hover:border-[--gh-accent-emphasis]/70 hover:text-[--gh-accent-emphasis]"
                :aria-label="copyFilterLabel"
                @click="copyCurrentArchiveView"
              >
                <UIcon :name="copyFilterState === 'copied' ? 'i-lucide-check' : 'i-lucide-link'" class="size-4" />
                {{ copyFilterLabel }}
              </button>
              <span
                v-if="copyFilterState !== 'idle'"
                class="sr-only"
                role="status"
              >
                {{ copyFilterLabel }}
              </span>
              <button
                v-if="hiddenTagCount > 0"
                type="button"
                class="inline-flex min-h-11 items-center gap-1 rounded-full border border-transparent bg-transparent px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.25em] text-muted transition-colors duration-200 hover:text-[--gh-accent-emphasis]"
                :aria-expanded="showAllTags"
                aria-controls="tag-filter-list"
                @click="toggleTagVisibility"
              >
                {{ showAllTags ? '收起标签' : `展开更多 (${hiddenTagCount})` }}
              </button>
            </div>
          </div>

          <div
            v-if="activeFilterChips.length"
            class="flex flex-wrap items-center gap-2 rounded-xl border border-[--surface-border]/60 bg-[--panel-bg-soft] px-3 py-2"
            aria-label="当前筛选条件"
          >
            <span class="text-[0.65rem] uppercase tracking-[0.25em] text-muted/70">当前筛选</span>
            <button
              v-for="chip in activeFilterChips"
              :key="chip.key"
              type="button"
              class="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-[--gh-accent-emphasis]/30 bg-[--gh-accent-subtle] px-3 py-2 text-xs font-medium text-[--gh-accent-emphasis] transition-colors hover:border-[--gh-accent-emphasis] hover:bg-[rgba(31,111,235,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[--panel-bg-soft] dark:hover:bg-[rgba(65,132,228,0.26)]"
              :aria-label="chip.removeLabel"
              @click="removeFilterChip(chip.key)"
            >
              <span class="shrink-0 text-[0.6rem] uppercase tracking-[0.18em] text-[--gh-accent-emphasis]/80">
                {{ chip.label }}
              </span>
              <span class="min-w-0 truncate">{{ chip.value }}</span>
              <UIcon name="i-lucide-x" class="size-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div
            class="filter-scroll-shell"
            :class="{ 'filter-scroll-shell--scrollable': !showAllTags }"
          >
            <div
              id="tag-filter-list"
              data-filter-group="tags"
              class="flex gap-3 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              :class="showAllTags ? 'flex-wrap' : 'flex-nowrap overflow-x-auto pr-6'"
              role="group"
              aria-label="按标签筛选文章，可用左右方向键移动"
              @keydown="handleTagGroupKeydown"
            >
              <button
                :class="[tagButtonBaseClass, activeTag ? tagButtonInactiveClass : tagButtonActiveClass]"
                type="button"
                :aria-pressed="!activeTag"
                :aria-label="`显示全部标签文章，共 ${totalArticleCount} 篇`"
                aria-controls="article-results"
                @click="toggleTag(null)"
              >
                <span class="min-w-0 truncate whitespace-nowrap">全部</span>
                <span
                  :class="[tagBadgeBaseClass, activeTag ? tagBadgeInactiveClass : tagBadgeActiveClass]"
                >
                  {{ totalArticleCount }}
                </span>
              </button>

              <button
                v-for="tag in visibleTags"
                :key="tag.label"
                :class="[tagButtonBaseClass, activeTag === tag.label ? tagButtonActiveClass : tagButtonInactiveClass]"
                type="button"
                :aria-pressed="activeTag === tag.label"
                :aria-label="`筛选标签「${tag.label}」，${tag.count} 篇文章`"
                aria-controls="article-results"
                @click="toggleTag(tag.label)"
              >
                <span class="min-w-0 truncate whitespace-nowrap">{{ tag.label }}</span>
                <span
                  :class="[tagBadgeBaseClass, activeTag === tag.label ? tagBadgeActiveClass : tagBadgeInactiveClass]"
                >
                  {{ tag.count }}
                </span>
              </button>
            </div>
          </div>

          <div
            v-if="allYears.length"
            class="border-t border-[--surface-border]/60 pt-3"
          >
            <div class="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted/70">
              按年份浏览
            </div>
            <div class="filter-scroll-shell filter-scroll-shell--scrollable">
              <div
                id="year-filter-list"
                data-filter-group="years"
                class="flex gap-3 overflow-x-auto py-1 pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label="按年份筛选文章，可用左右方向键移动"
                @keydown="handleYearGroupKeydown"
              >
                <button
                  :class="[tagButtonBaseClass, activeYear ? tagButtonInactiveClass : tagButtonActiveClass]"
                  type="button"
                  :aria-pressed="!activeYear"
                  :aria-label="`显示全部年份文章，共 ${totalArticleCount} 篇`"
                  aria-controls="article-results"
                  @click="toggleYear(null)"
                >
                  <span class="min-w-0 truncate whitespace-nowrap">全部年份</span>
                  <span :class="[tagBadgeBaseClass, activeYear ? tagBadgeInactiveClass : tagBadgeActiveClass]">
                    {{ totalArticleCount }}
                  </span>
                </button>
                <button
                  v-for="year in allYears"
                  :key="year.label"
                  :class="[tagButtonBaseClass, activeYear === year.label ? tagButtonActiveClass : tagButtonInactiveClass]"
                  type="button"
                  :aria-pressed="activeYear === year.label"
                  :aria-label="`筛选 ${year.label} 年文章，${year.count} 篇`"
                  aria-controls="article-results"
                  @click="toggleYear(year.label)"
                >
                  <span class="min-w-0 truncate whitespace-nowrap">{{ year.label }}</span>
                  <span :class="[tagBadgeBaseClass, activeYear === year.label ? tagBadgeActiveClass : tagBadgeInactiveClass]">
                    {{ year.count }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="pending"
          class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
          role="status"
          aria-live="polite"
        >
          正在加载，请稍候。
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          class="text-sm sm:text-base"
          role="alert"
        >
          数据暂不可用，请稍后重试。
        </UAlert>

        <template v-else>
          <div
            id="archive-results-summary"
            ref="resultsSummaryRef"
            tabindex="-1"
            class="flex flex-col gap-1 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg-soft] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            aria-live="polite"
          >
            <p class="text-sm font-medium text-muted-strong">
              {{ resultSummary }}
            </p>
            <p
              v-if="firstVisibleArticle"
              class="text-xs leading-5 text-muted"
            >
              当前第一篇：{{ firstVisibleArticle.title }}
            </p>
          </div>

          <TransitionGroup
            id="article-results"
            name="card-cascade"
            tag="div"
            class="cards-stack"
            role="list"
            :aria-label="resultSummary"
            aria-describedby="archive-results-summary"
          >
            <div
              v-for="(article, index) in visibleArticles"
              :key="article.path"
              class="cards-stack__item"
              role="listitem"
              :class="{ 'cards-stack__item--focused': focusedArticlePath === article.path }"
              :data-article-index="index"
              :data-article-path="article.path"
              :style="{ '--stagger': `${index * 60}ms` }"
            >
              <ArticleCard :article="article" @select-tag="selectCardTag" />
            </div>
          </TransitionGroup>

          <div v-if="hasMoreArticles" class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[--surface-border]/70 bg-[--panel-bg-soft] px-4 py-5 text-center">
            <p class="text-sm text-muted">
              已显示 {{ visibleArticles.length }} 篇，还有 {{ hiddenArticleCount }} 篇可继续浏览。
            </p>
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-2 rounded-full border border-[--surface-border]/80 bg-[--panel-bg] px-4 py-2 text-sm font-medium text-[--gh-accent-emphasis] transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle]"
              @click="loadMoreArticles"
            >
              加载更多
              <UIcon name="i-lucide-chevrons-down" class="size-4" />
            </button>
          </div>

          <div
            v-if="isEmpty"
            class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
            role="status"
            aria-live="polite"
          >
            <div class="mx-auto flex max-w-md flex-col items-center gap-3">
              <UIcon name="i-lucide-search-x" class="size-8 text-[--gh-accent-emphasis]" />
              <p class="font-medium text-muted-strong">
                没有找到匹配的文章
              </p>
              <p class="text-sm leading-6 text-muted">
                换一个关键词，或者清空筛选后继续浏览完整归档。
              </p>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="inline-flex min-h-11 items-center gap-2 rounded-full border border-[--surface-border]/80 bg-[--panel-bg] px-4 py-2 text-sm font-medium text-[--gh-accent-emphasis] transition-colors hover:border-[--gh-accent-emphasis]/70 hover:bg-[--gh-accent-subtle]"
                aria-label="清空当前搜索和筛选条件"
                @click="clearFilters"
              >
                清空筛选
                <UIcon name="i-lucide-rotate-ccw" class="size-4" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-cascade-enter-active {
  animation: card-cascade-in 0.45s cubic-bezier(0.21, 0.61, 0.35, 1) both;
  animation-delay: var(--stagger, 0ms);
}

.card-cascade-leave-active {
  animation: card-cascade-out 0.28s cubic-bezier(0.49, 0.03, 0.41, 1) both;
}

.card-cascade-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes card-cascade-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    filter: blur(6px);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.02);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes card-cascade-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-16px) scale(0.92);
    filter: blur(8px);
  }
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cards-stack__item {
  width: 100%;
}

.cards-stack__item--focused {
  border-radius: 1.5rem;
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 58%, transparent);
  outline-offset: 4px;
}

[tabindex='-1']:focus {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 34%, transparent);
  outline-offset: 4px;
}

.tags-scroll {
  scrollbar-width: none;
}

.filter-scroll-shell {
  position: relative;
  min-width: 0;
}

.filter-scroll-shell--scrollable::after {
  content: '';
  position: absolute;
  inset-block: 0;
  right: -0.25rem;
  width: 3rem;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--panel-bg) 78%);
  pointer-events: none;
}

@media (min-width: 640px) {
  .filter-scroll-shell--scrollable::after {
    width: 4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-cascade-enter-active,
  .card-cascade-leave-active,
  .card-cascade-move {
    animation: none;
    transition: none;
  }
}
</style>
