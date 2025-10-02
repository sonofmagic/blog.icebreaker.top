<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '@/components/ArticleCard.vue'

const PAGE_SIZE = 6

const profileMeta = [
  { label: 'icebreaker / yang qiming', icon: 'i-lucide-user' },
  { label: 'Shanghai, China', icon: 'i-lucide-map-pin' },
  { label: 'hi@icebreaker.top', icon: 'i-lucide-mail', href: 'mailto:hi@icebreaker.top' },
  { label: 'github.com/innno', icon: 'i-lucide-github', href: 'https://github.com/innno' },
]

const nowItems = [
  { label: '用照片写每周一次的 mini log。' },
  { label: '读完《当下的力量》，整理读书卡片。' },
  { label: '为 blog 做一些样式实验。' },
]

const footprintItems = [
  { label: 'Notion', icon: 'i-simple-icons-notion', description: '记录阅读摘录与旅行计划' },
  { label: 'Spotify', icon: 'i-simple-icons-spotify', description: '循环播放 chillhop 与 city pop' },
  { label: '豆瓣', icon: 'i-simple-icons-douban', description: '写影评，追踪想看的书和电影' },
  { label: 'Nuxt', icon: 'i-simple-icons-nuxt', description: '这个站点基于 Nuxt 4 打造' },
  { label: 'Figma', icon: 'i-simple-icons-figma', description: '快节奏产出轻量原型' },
  { label: 'Telegram', icon: 'i-simple-icons-telegram', description: '偶尔在频道里更新碎碎念' },
]

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
  <UStack gap="8">
    <UCard variant="ghost" class="app-card rounded-3xl p-6 md:p-8">
      <template #header>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-3">
            <UHeading tag="h1" size="xl" weight="semibold" class="tracking-tight">我是 icebreaker</UHeading>
            <p class="max-w-2xl text-sm text-muted">
              喜欢写字、记录身边的小事，也偶尔分享一些技术实验。这个角落更像一本随笔本，慢慢累积生活与灵感的碎片。
            </p>
          </div>
          <div class="relative">
            <span class="absolute -right-3 -top-3 hidden rounded-full bg-[--gh-accent-subtle] px-2 py-1 text-[10px] font-medium uppercase text-[--gh-accent-emphasis] tracking-[0.2em] md:inline-flex">
              hello
            </span>
            <UAvatar icon="i-lucide-feather" size="xl" variant="soft" class="border border-[--surface-border] shadow-sm" />
          </div>
        </div>
      </template>

      <div class="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div>
          <UList :items="profileMeta" class="space-y-3">
            <template #item="{ item }">
              <ULink
                v-if="item.href"
                :href="item.href"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 text-sm text-muted transition hover:text-[--gh-accent-emphasis]"
              >
                <UIcon :name="item.icon" class="size-4 text-[--gh-accent-emphasis]" />
                {{ item.label }}
              </ULink>
              <div v-else class="flex items-center gap-2 text-sm text-muted">
                <UIcon :name="item.icon" class="size-4 text-[--gh-accent-emphasis]" />
                {{ item.label }}
              </div>
            </template>
          </UList>
        </div>

        <UCard variant="ghost" class="app-card-soft rounded-2xl">
          <template #header>
            <UHeading tag="h3" size="sm" weight="medium" class="tracking-wide text-muted-strong">最近在忙</UHeading>
          </template>
          <UList :items="nowItems" icon="i-lucide-dot" class="text-sm text-muted" />
        </UCard>
      </div>
    </UCard>

    <UCard variant="ghost" class="app-card rounded-3xl p-6">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="flex size-9 items-center justify-center rounded-full bg-[--gh-accent-subtle] text-[--gh-accent-emphasis]">
              <UIcon name="i-lucide-globe-2" class="size-4" />
            </span>
            <UHeading tag="h2" size="md" weight="semibold">这些地方也常去</UHeading>
          </div>
          <UBadge color="primary" variant="soft" class="uppercase tracking-wide">足迹</UBadge>
        </div>
      </template>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="item in footprintItems"
          :key="item.label"
          variant="ghost"
          class="app-card-soft rounded-2xl p-4 transition hover:-translate-y-1 hover:border-[--surface-border-strong]"
        >
          <div class="flex items-start gap-3">
            <UIcon :name="item.icon" class="size-7 text-[--gh-accent-emphasis]" />
            <div>
              <p class="font-medium text-muted-strong">{{ item.label }}</p>
              <p class="text-sm text-muted">{{ item.description }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>

    <UCard variant="ghost" class="app-card rounded-3xl p-6">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <UHeading tag="h2" size="md" weight="semibold" class="tracking-tight">最近写下的内容</UHeading>
            <p class="text-sm text-muted">随手的想法、游记、摘录，都记录在这里。</p>
          </div>
          <UButton to="/articles" variant="ghost" icon="i-lucide-arrow-right" class="rounded-full border border-transparent bg-[--panel-bg-soft] px-4">
            查看全部
          </UButton>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UCard v-if="pending" variant="ghost" class="app-placeholder col-span-full rounded-2xl p-6 text-center text-sm">
          正在加载文章…
        </UCard>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-triangle"
          class="col-span-full"
        >
          加载失败，请稍后再试。
        </UAlert>

        <template v-else>
          <ArticleCard
            v-for="article in recentArticles"
            :key="article.path"
            :article="article"
          />
          <UCard v-if="!hasArticles" variant="ghost" class="app-placeholder col-span-full rounded-2xl p-6 text-center text-sm">
            暂时还没有写新的内容，改天再来看看吧。
          </UCard>
        </template>
      </div>

      <template #footer>
        <div class="flex items-center justify-end">
          <UButton variant="ghost" icon="i-lucide-refresh-ccw" class="rounded-full border border-transparent px-4" @click="refresh">
            刷新列表
          </UButton>
        </div>
      </template>
    </UCard>

    <UCard variant="ghost" class="app-card rounded-3xl p-6">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="flex size-9 items-center justify-center rounded-full bg-[--gh-accent-subtle] text-[--gh-accent-emphasis]">
            <UIcon name="i-lucide-heart" class="size-4" />
          </span>
          <UHeading tag="h2" size="md" weight="semibold">关于这个小站</UHeading>
        </div>
      </template>
      <UProse class="text-sm text-muted">
        <p>
          这里的文章大多记录针对生活、旅行、阅读的感受，也会偶尔写一点技术随笔。没有固定的更新节奏，只在灵感出现或心情平静时动笔。如果你有共鸣，欢迎写信给我。
        </p>
      </UProse>
    </UCard>
  </UStack>
</template>
