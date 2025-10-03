<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const visibleArticles = computed(() => filteredArticles.value)
const isEmpty = computed(() => !pending.value && !error.value && filteredArticles.value.length === 0)

watch(activeTag, () => {
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
    <div class="app-card app-card-static rounded-3xl p-4 sm:p-6 lg:p-8">
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted">
          <UBadge variant="soft" color="primary" class="text-[0.65rem] uppercase tracking-[0.25em]">
            All posts
          </UBadge>
          <span class="text-muted/80">· {{ filteredArticleCount }}</span>
        </div>
        <span v-if="activeTag" class="text-xs text-muted/70 sm:text-sm">（筛选自 {{ totalArticleCount }} 篇）</span>
      </div>

      <div class="mt-5 space-y-6">
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
              :class="showAllTags ? 'flex-wrap' : 'flex-nowrap overflow-x-auto pr-6'"
            >
              <button
                class="inline-flex items-center gap-2 rounded-full border border-[--surface-border]/70 bg-[--panel-bg] px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-muted transition-colors duration-150 hover:bg-[--panel-bg-soft] hover:border-[--surface-border]/40 hover:text-[--gh-accent-emphasis] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[--panel-bg]"
                :class="activeTag ? '' : 'border-[--gh-accent-emphasis] bg-[--gh-accent-emphasis] text-white shadow-[0_12px_30px_-18px_rgba(31,111,235,0.7)]'"
                type="button"
                :aria-pressed="!activeTag"
                @click="toggleTag(null)"
              >
                <span class="whitespace-nowrap">全部</span>
                <span
                  class="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[0.65rem] tracking-[0.08em]"
                  :class="activeTag ? '' : 'bg-white/20 text-white'"
                >
                  {{ totalArticleCount }}
                </span>
              </button>

              <button
                v-for="tag in visibleTags"
                :key="tag.label"
                class="inline-flex items-center gap-2 rounded-full border border-[--surface-border]/70 bg-[--panel-bg] px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-muted transition-colors duration-150 hover:bg-[--panel-bg-soft] hover:border-[--surface-border]/40 hover:text-[--gh-accent-emphasis] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--gh-accent-emphasis]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[--panel-bg]"
                :class="activeTag === tag.label ? 'border-[--gh-accent-emphasis] bg-[--gh-accent-emphasis] text-white shadow-[0_12px_30px_-18px_rgba(31,111,235,0.7)]' : ''"
                type="button"
                :aria-pressed="activeTag === tag.label"
                @click="toggleTag(tag.label)"
              >
                <span class="whitespace-nowrap">{{ tag.label }}</span>
                <span
                  class="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-400/10 px-2 py-0.5 text-[0.65rem] tracking-[0.08em]"
                  :class="activeTag === tag.label ? 'bg-white/20 text-white' : ''"
                >
                  {{ tag.count }}
                </span>
              </button>
            </div>

          </div>
        </div>

        <div
          v-if="pending"
          class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
        >
          正在加载，请稍候。
        </div>

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
            name="card-cascade"
            tag="div"
            class="cards-stack"
          >
            <div
              v-for="(article, index) in visibleArticles"
              :key="article.path"
              class="cards-stack__item"
              :style="{ '--stagger': `${index * 60}ms` }"
            >
              <ArticleCard :article="article" />
            </div>
          </TransitionGroup>

          <div
            v-if="isEmpty"
            class="app-placeholder rounded-2xl p-6 text-center text-sm sm:text-base"
          >
            暂无内容，敬请期待后续更新。
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

.tags-scroll {
  scrollbar-width: none;
}
</style>
