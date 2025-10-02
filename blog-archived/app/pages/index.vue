<script setup lang="ts">
import { queryCollection } from '#imports'
import ArticleCard from '@/components/ArticleCard.vue'

const PAGE_SIZE = 20

function mapToSummary(entry: Record<string, any>) {
  return {
    path: (typeof entry.path === 'string' && entry.path) || (typeof entry._path === 'string' && entry._path) || '/',
    title: typeof entry.title === 'string' && entry.title.length > 0 ? entry.title : 'Untitled',
    description: typeof entry.description === 'string' ? entry.description : undefined,
    date: typeof entry.date === 'string' ? entry.date : undefined,
    tags: Array.isArray(entry.tags) ? entry.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
    readingMinutes: typeof entry.readingMinutes === 'number' ? entry.readingMinutes : undefined,
    readingWords: typeof entry.readingWords === 'number' ? entry.readingWords : undefined,
  }
}

const { data, pending, error, refresh } = await useAsyncData('articles:index', async () => {
  const entries = await queryCollection('articles')
    .andWhere(group =>
      group
        .where('draft', 'IS NULL')
        .orWhere(orGroup => orGroup.where('draft', '<>', true)),
    )
    .order('date', 'DESC')
    .limit(PAGE_SIZE)
    .all()

  return entries.map(mapToSummary)
})
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
    <header class="flex flex-col gap-2 text-center">
      <h1 class="text-3xl font-bold text-fg-default">
        icebreaker.top
      </h1>
      <p class="text-sm text-fg-muted">
        记录与分享 —— 最新文章列表
      </p>
    </header>

    <div v-if="pending" class="text-center text-sm text-fg-muted">
      正在加载文章…
    </div>

    <div v-else-if="error" class="text-center text-sm text-red-500">
      加载失败，请稍后重试。
    </div>

    <section v-else class="flex flex-col gap-4">
      <ArticleCard v-for="article in data || []" :key="article.path" :article="article" />
      <p v-if="(data?.length || 0) === 0" class="text-center text-sm text-fg-muted">
        暂无文章。
      </p>
    </section>

    <footer class="mt-10 flex items-center justify-center text-xs text-fg-muted">
      <button
        class="rounded-md border border-border-muted px-3 py-2 transition hover:bg-border-muted/20"
        type="button"
        @click="refresh"
      >
        刷新列表
      </button>
    </footer>
  </main>
</template>
