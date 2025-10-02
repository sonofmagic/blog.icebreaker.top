<script setup lang="ts">
import { computed } from 'vue'
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
const articleCount = computed(() => articles.value.length)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="app-card-soft space-y-2 rounded-3xl p-6 text-muted">
      <UBadge variant="soft" color="primary">
        All posts
      </UBadge>
      <h1 class="text-muted-strong text-3xl font-semibold tracking-tight">
        全部文章
      </h1>
      <p class="text-sm">
        按时间倒序排列，方便从最新开始阅读。
      </p>
      <p class="text-xs">
        目前共 {{ articleCount }} 篇。
      </p>
    </header>

    <UCard variant="ghost" class="app-card rounded-3xl p-6">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-muted-strong">
            <span class="flex size-9 items-center justify-center rounded-full bg-[--gh-accent-subtle] text-[--gh-accent-emphasis]">
              <UIcon name="i-lucide-align-left" class="size-4" />
            </span>
            <h2 class="text-sm font-medium tracking-normal">
              文章列表
            </h2>
          </div>
          <UButton variant="ghost" icon="i-lucide-refresh-ccw" class="rounded-full border border-transparent px-4" @click="refresh">
            刷新
          </UButton>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UCard v-if="pending" variant="ghost" class="app-placeholder col-span-full rounded-2xl p-6 text-center text-sm">
          正在加载，请稍候。
        </UCard>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          class="col-span-full"
        >
          数据暂不可用，请稍后重试。
        </UAlert>

        <template v-else>
          <ArticleCard
            v-for="article in articles"
            :key="article.path"
            :article="article"
          />
          <UCard v-if="articles.length === 0" variant="ghost" class="app-placeholder col-span-full rounded-2xl p-6 text-center text-sm">
            暂无内容，敬请期待后续更新。
          </UCard>
        </template>
      </div>
    </UCard>
  </div>
</template>
