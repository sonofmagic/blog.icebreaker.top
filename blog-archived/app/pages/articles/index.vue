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
  <UStack gap="6">
    <header class="space-y-2">
      <UBadge variant="soft" color="primary">All posts</UBadge>
      <UHeading tag="h1" size="xl" weight="semibold">文章总览</UHeading>
      <p class="text-sm text-muted">这些笔记按时间倒序排好，方便沿着时间线回看当时的想法。</p>
      <p class="text-xs text-muted">目前共 {{ articleCount }} 篇。</p>
    </header>

    <UCard variant="ghost" class="border border-[--gh-border-default] shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <UHeading tag="h2" size="sm" weight="medium">文章列表</UHeading>
          <UButton variant="ghost" icon="i-lucide-refresh-ccw" @click="refresh">刷新</UButton>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UCard v-if="pending" variant="ghost" class="col-span-full border border-dashed border-[--gh-border-default] bg-[--gh-canvas-inset] text-center text-sm text-muted">
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
          <UCard v-if="articles.length === 0" variant="ghost" class="col-span-full border border-dashed border-[--gh-border-default] bg-[--gh-canvas-inset] text-center text-sm text-muted">
            暂无内容，敬请期待后续更新。
          </UCard>
        </template>
      </div>
    </UCard>
  </UStack>
</template>
