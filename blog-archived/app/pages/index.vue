<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ArticleCard from '@/components/ArticleCard.vue'

definePageMeta({
  alias: ['/articles'],
})

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

function mapToSummary(entry: Record<string, any>) {
  return {
    path: (typeof entry.path === 'string' && entry.path) || '/',
    title: typeof entry.title === 'string' && entry.title.length > 0 ? entry.title : 'Untitled',
    description: typeof entry.description === 'string' ? entry.description : undefined,
    date: typeof entry.date === 'string' ? entry.date : undefined,
    tags: Array.isArray(entry.tags) ? entry.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
    readingMinutes: typeof entry.readingMinutes === 'number' ? entry.readingMinutes : undefined,
    readingWords: typeof entry.readingWords === 'number' ? entry.readingWords : undefined,
  }
}

const { data, pending, error, refresh } = await useAsyncData('articles:home', async () => {
  const entries = await queryCollection('articles').all()
  const articleEntries = Array.isArray(entries) ? entries : []

  return articleEntries
    .map(entry => ({ ...entry, ...parseMeta(entry) }))
    .filter(entry => entry.draft !== true)
    .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
    .map(mapToSummary)
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
  .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)))

const activeTag = ref<string | null>(null)

const filteredArticles = computed(() => {
  if (!activeTag.value) {
    return articles.value
  }
  return articles.value.filter(article => article.tags.includes(activeTag.value!))
})

const filteredArticleCount = computed(() => filteredArticles.value.length)

const MAX_VISIBLE_TAGS = 10
const showAllTags = ref(false)

const visibleTags = computed(() => {
  if (showAllTags.value) {
    return allTags.value
  }
  return allTags.value.slice(0, MAX_VISIBLE_TAGS)
})

const hiddenTagCount = computed(() => Math.max(allTags.value.length - MAX_VISIBLE_TAGS, 0))

const INITIAL_BATCH = 9
const LOAD_BATCH = 6

const itemsToDisplay = ref(INITIAL_BATCH)
const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const visibleArticles = computed(() => filteredArticles.value.slice(0, itemsToDisplay.value))
const canLoadMore = computed(() => itemsToDisplay.value < filteredArticles.value.length)
const isEmpty = computed(() => !pending.value && !error.value && filteredArticles.value.length === 0)

function resetItems() {
  itemsToDisplay.value = Math.min(INITIAL_BATCH, filteredArticles.value.length || INITIAL_BATCH)
}

watch([filteredArticles, pending], () => {
  if (!pending.value) {
    resetItems()
  }
}, { immediate: true })

watch(pending, (isPending) => {
  if (isPending) {
    itemsToDisplay.value = INITIAL_BATCH
  }
})

watch(activeTag, () => {
  if (!pending.value) {
    resetItems()
  }
  if (activeTag.value && !showAllTags.value) {
    const tagInVisible = visibleTags.value.some(tag => tag.label === activeTag.value)
    if (!tagInVisible) {
      showAllTags.value = true
    }
  }
})

watch(hiddenTagCount, (count) => {
  if (count === 0) {
    showAllTags.value = false
  }
})

watch(loadMoreRef, (element, previous) => {
  if (!observer) {
    return
  }
  if (previous) {
    observer.unobserve(previous)
  }
  if (element) {
    observer.observe(element)
  }
})

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (!entries.length) {
      return
    }
    if (entries.some(entry => entry.isIntersecting)) {
      itemsToDisplay.value = Math.min(itemsToDisplay.value + LOAD_BATCH, filteredArticles.value.length)
    }
  }, {
    rootMargin: '200px 0px 200px 0px',
    threshold: 0.1,
  })

  if (loadMoreRef.value) {
    observer.observe(loadMoreRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function toggleTag(tag: string | null) {
  if (!tag) {
    activeTag.value = null
    return
  }
  activeTag.value = activeTag.value === tag ? null : tag
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
</script>

<template>
  <div class="flex flex-col gap-6 lg:gap-8">
    <UCard variant="ghost" class="app-card app-card-static rounded-3xl p-4 sm:p-6 lg:p-8">
      <template #header>
        <div class="flex flex-wrap items-start gap-4 sm:items-center sm:justify-between">
          <div class="space-y-3 text-muted">
            <UBadge variant="soft" color="primary" class="w-fit text-[0.65rem] uppercase tracking-[0.25em]">
              All posts
            </UBadge>
            <div class="space-y-2">
              <h1 class="text-muted-strong text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                全部文章
              </h1>
              <p class="text-sm leading-relaxed sm:text-base">
                按时间倒序记录日常、想法与观察。
              </p>
              <p class="text-xs tracking-wide text-muted sm:text-sm">
                当前共 {{ filteredArticleCount }} 篇文章<span v-if="activeTag" class="text-muted/70"> · 筛选自 {{ totalArticleCount }} 篇</span>
              </p>
            </div>
          </div>
          <UButton
            variant="ghost"
            icon="i-lucide-refresh-ccw"
            class="rounded-full border border-transparent px-3 text-sm sm:px-4"
            @click="refresh"
          >
            刷新
          </UButton>
        </div>
      </template>

      <div class="space-y-6">
        <div class="space-y-2 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-3 py-3 sm:px-4 sm:py-4">
          <div class="flex flex-wrap items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted/70">
            <span>按标签浏览</span>
            <button
              v-if="hiddenTagCount > 0"
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-transparent bg-transparent px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.25em] text-muted transition-colors duration-200 hover:text-[--gh-accent-emphasis]"
              @click="toggleTagVisibility"
            >
              {{ showAllTags ? '收起标签' : `展开更多 (${hiddenTagCount})` }}
            </button>
          </div>

          <div class="relative">
            <div
              class="flex gap-3 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              :class="showAllTags ? 'flex-wrap' : 'flex-nowrap overflow-x-auto pr-10'"
            >
              <button
                class="relative inline-flex items-center gap-2 rounded-full border border-transparent bg-[--panel-bg] px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_20px_-12px_rgba(15,23,42,0.4)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-400/50 hover:text-[--gh-accent-emphasis] after:absolute after:inset-0 after:rounded-full after:bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.06))] after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[--panel-bg]"
                :class="activeTag ? '' : 'border-[--gh-accent-emphasis] bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.02))] text-[--gh-accent-emphasis] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_-14px_rgba(59,130,246,0.6)]'"
                type="button"
                :aria-pressed="!activeTag"
                @click="toggleTag(null)"
              >
                <span class="whitespace-nowrap">全部</span>
                <span
                  class="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[0.65rem] tracking-[0.08em]"
                  :class="activeTag ? '' : 'bg-[rgba(59,130,246,0.16)] text-[--gh-accent-emphasis]'"
                >
                  {{ totalArticleCount }}
                </span>
              </button>

              <button
                v-for="tag in visibleTags"
                :key="tag.label"
                class="relative inline-flex items-center gap-2 rounded-full border border-transparent bg-[--panel-bg] px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_20px_-12px_rgba(15,23,42,0.4)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-400/50 hover:text-[--gh-accent-emphasis] after:absolute after:inset-0 after:rounded-full after:bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.06))] after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[--panel-bg]"
                :class="activeTag === tag.label ? 'border-[--gh-accent-emphasis] bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.02))] text-[--gh-accent-emphasis] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_24px_-14px_rgba(59,130,246,0.6)]' : ''"
                type="button"
                :aria-pressed="activeTag === tag.label"
                @click="toggleTag(tag.label)"
              >
                <span class="whitespace-nowrap">#{{ tag.label }}</span>
                <span
                  class="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[0.65rem] tracking-[0.08em]"
                  :class="activeTag === tag.label ? 'bg-[rgba(59,130,246,0.16)] text-[--gh-accent-emphasis]' : ''"
                >
                  {{ tag.count }}
                </span>
              </button>
            </div>

            <div
              v-if="!showAllTags && hiddenTagCount > 0"
              class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[--panel-bg] to-transparent"
            />
          </div>
        </div>

        <UCard
          v-if="pending"
          variant="ghost"
          class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
        >
          正在加载，请稍候。
        </UCard>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          class="text-sm sm:text-base"
        >
          数据暂不可用，请稍后重试。
        </UAlert>

        <template v-else>
          <TransitionGroup
            name="fade-scale"
            tag="div"
            class="columns-1 gap-4 sm:columns-2 sm:gap-6 xl:columns-3"
          >
            <div
              v-for="article in visibleArticles"
              :key="article.path"
              class="mb-4 break-inside-avoid"
            >
              <ArticleCard :article="article" />
            </div>
          </TransitionGroup>

          <UCard
            v-if="isEmpty"
            variant="ghost"
            class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
          >
            暂无内容，敬请期待后续更新。
          </UCard>

          <div
            v-else-if="canLoadMore"
            ref="loadMoreRef"
            class="flex items-center justify-center rounded-full border border-dashed border-[--surface-border] bg-[--panel-bg-soft] px-4 py-2 text-xs text-muted"
          >
            下拉加载更多…
          </div>
        </template>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.tags-scroll {
  scrollbar-width: none;
}

</style>
