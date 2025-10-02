<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '@/components/ArticleCard.vue'

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

const { data, pending, error, refresh } = await useAsyncData('articles:archive', async () => {
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
    <header class="space-y-3">
      <p class="text-xs uppercase tracking-[0.24em] text-fg-subtle">All Posts</p>
      <h1 class="text-2xl font-semibold text-fg-default">全部文章</h1>
      <p class="text-sm text-fg-muted">这些笔记按时间倒序排好，方便你沿着时间线回看当时的想法。</p>
      <p class="text-xs text-fg-subtle">目前共 {{ articleCount }} 篇。</p>
    </header>

    <section class="rounded-2xl border border-border-muted bg-canvas-default shadow-card">
      <div v-if="pending" class="flex items-center justify-center px-6 py-10 text-sm text-fg-muted">
        正在加载，请稍候。
      </div>

      <div v-else-if="error" class="px-6 py-6 text-sm text-red-400">
        数据暂不可用，请稍后重试。
      </div>

      <template v-else>
        <div class="flex flex-col divide-y divide-border-muted">
          <ArticleCard
            v-for="article in articles"
            :key="article.path"
            :article="article"
            class="rounded-none border-0 shadow-none first:rounded-t-2xl last:rounded-b-2xl"
          />
          <p v-if="articles.length === 0" class="px-6 py-12 text-center text-sm text-fg-muted">
            暂无内容，敬请期待后续更新。
          </p>
        </div>
        <div class="border-t border-border-muted px-6 py-4 text-xs text-fg-subtle">
          <button type="button" class="text-accent-emphasis hover:text-accent-emphasis" @click="refresh">
            刷新列表
          </button>
        </div>
      </template>
    </section>
  </div>
</template>
