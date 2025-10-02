<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '@/components/ArticleCard.vue'

const PAGE_SIZE = 6

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

const { data, pending, error, refresh } = await useAsyncData('articles:index', async () => {
  const entries = await queryCollection('articles').all()
  const articleEntries = Array.isArray(entries) ? entries : []

  return articleEntries
    .map(entry => ({ ...entry, ...parseMeta(entry) }))
    .filter(entry => entry.draft !== true)
    .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
    .slice(0, PAGE_SIZE)
    .map(mapToSummary)
})

const recentArticles = computed(() => data.value || [])
const hasArticles = computed(() => recentArticles.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-10">
    <section class="rounded-2xl border border-border-muted bg-canvas-default px-6 py-8 shadow-card">
      <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div class="flex-1 space-y-4">
          <h1 class="text-3xl font-semibold text-fg-default">
            我是 icebreaker
          </h1>
          <p class="max-w-2xl text-sm leading-relaxed text-fg-muted">
            喜欢写字、记录身边的小事，也偶尔分享一些技术实验。这个角落更像一本随笔本，慢慢累积生活与灵感的碎片。
          </p>
          <ul class="flex flex-wrap gap-x-6 gap-y-3 text-xs text-fg-subtle">
            <li class="flex items-center gap-2">
              <Icon name="line-md:account" class="h-4 w-4" />
              <span>icebreaker / yang qiming</span>
            </li>
            <li class="flex items-center gap-2">
              <Icon name="logos:google-maps" class="h-4 w-4" />
              <span>Shanghai, China</span>
            </li>
            <li class="flex items-center gap-2">
              <Icon name="simple-icons:github" class="h-4 w-4" />
              <a class="hover:text-accent-emphasis" href="https://github.com/innno" target="_blank" rel="noopener">GitHub</a>
            </li>
            <li class="flex items-center gap-2">
              <Icon name="logos:google-gmail" class="h-4 w-4" />
              <a class="hover:text-accent-emphasis" href="mailto:hi@icebreaker.top">hi@icebreaker.top</a>
            </li>
          </ul>
        </div>

        <div class="flex w-full flex-col gap-4 rounded-xl border border-border-muted bg-canvas-inset p-5 text-sm text-fg-muted md:w-64">
          <p class="text-xs uppercase tracking-[0.24em] text-fg-subtle">最近在忙</p>
          <ul class="space-y-2">
            <li>• 用照片写每周一次的 mini log。</li>
            <li>• 读完《当下的力量》，开始整理读书卡片。</li>
            <li>• 给博客做一点小的样式调整。</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-border-muted bg-canvas-default px-6 py-6 shadow-card">
      <h2 class="text-lg font-semibold text-fg-default">这些地方也常去</h2>
      <ul class="mt-4 grid gap-4 text-sm text-fg-muted md:grid-cols-3">
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="simple-icons:notion" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">Notion</p>
            <p class="text-xs text-fg-subtle">记录阅读摘录与旅行计划</p>
          </div>
        </li>
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="simple-icons:spotify" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">Spotify</p>
            <p class="text-xs text-fg-subtle">循环播放 chillhop 与 city pop</p>
          </div>
        </li>
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="simple-icons:douban" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">豆瓣</p>
            <p class="text-xs text-fg-subtle">写影评，追踪想看的书和电影</p>
          </div>
        </li>
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="logos:nuxt-icon" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">Nuxt</p>
            <p class="text-xs text-fg-subtle">这个站点用 Nuxt 4 打造</p>
          </div>
        </li>
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="simple-icons:figma" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">Figma</p>
            <p class="text-xs text-fg-subtle">快节奏产出轻量原型</p>
          </div>
        </li>
        <li class="flex items-center gap-3 rounded-lg border border-border-muted bg-canvas-inset px-4 py-3">
          <Icon name="simple-icons:telegram" class="h-5 w-5 text-accent-emphasis" />
          <div>
            <p class="text-sm font-medium text-fg-default">Telegram</p>
            <p class="text-xs text-fg-subtle">偶尔在频道里更新碎碎念</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="space-y-4">
      <header class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-fg-default">最近写下的内容</h2>
          <p class="text-sm text-fg-muted">随手的想法、游记、摘录，都记录在这里。</p>
        </div>
        <NuxtLink to="/articles" class="text-xs font-medium text-accent-emphasis hover:text-accent-emphasis">
          查看全部
        </NuxtLink>
      </header>

      <div class="grid gap-4 md:grid-cols-2">
        <div v-if="pending" class="col-span-full rounded-xl border border-dashed border-border-muted bg-canvas-default px-4 py-10 text-center text-sm text-fg-muted">
          正在加载文章…
        </div>

        <div v-else-if="error" class="col-span-full rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-6 text-sm text-red-400">
          加载失败，请稍后再试。
        </div>

        <template v-else>
          <ArticleCard
            v-for="article in recentArticles"
            :key="article.path"
            :article="article"
          />
          <p v-if="!hasArticles" class="col-span-full rounded-xl border border-border-muted bg-canvas-default px-4 py-10 text-center text-sm text-fg-muted">
            暂时还没有写新的内容，改天再来看看吧。
          </p>
        </template>
      </div>
    </section>

    <section class="rounded-2xl border border-border-muted bg-canvas-default px-6 py-6 shadow-card">
      <h2 class="text-lg font-semibold text-fg-default">关于这个小站</h2>
      <p class="mt-3 text-sm leading-relaxed text-fg-muted">
        这里的文章大多记录针对生活、旅行、阅读的感受，也会偶尔写一点技术随笔。没有固定的更新节奏，只在灵感出现或心情平静时动笔。如果你有共鸣，欢迎写信给我。
      </p>
    </section>
  </div>
</template>
