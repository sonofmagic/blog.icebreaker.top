<script setup lang="ts">
interface ArticleSummary {
  path: string
  title: string
  description?: string
  date?: string
  tags: string[]
  readingMinutes?: number
  readingWords?: number
}

const props = defineProps<{ article: ArticleSummary }>()
</script>

<template>
  <article class="rounded-lg border border-border-muted bg-canvas-default p-4 shadow-sm transition hover:shadow-md">
    <h2 class="text-lg font-semibold text-fg-default">
      <NuxtLink :to="article.path" class="hover:underline">
        {{ article.title }}
      </NuxtLink>
    </h2>
    <p v-if="article.description" class="mt-2 text-sm text-fg-muted">
      {{ article.description }}
    </p>
    <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
      <span v-if="article.date">发表于 {{ article.date }}</span>
      <span v-if="article.readingMinutes">约 {{ article.readingMinutes }} 分钟</span>
      <span v-if="article.readingWords">共 {{ article.readingWords }} 字</span>
    </div>
    <div v-if="article.tags.length" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="tag in article.tags"
        :key="tag"
        class="rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent-emphasis"
      >
        {{ tag }}
      </span>
    </div>
  </article>
</template>
