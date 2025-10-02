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
  <article class="rounded-xl border border-border-muted bg-canvas-default p-5 shadow-card transition hover:border-border-default hover:shadow-card-hover">
    <header class="flex flex-col gap-2">
      <h2 class="text-xl font-semibold text-fg-default">
        <NuxtLink :to="props.article.path" class="flex items-center gap-2 text-inherit hover:text-accent-emphasis">
          <Icon name="line-md:text-box" class="h-4 w-4 text-fg-muted" />
          <span>{{ props.article.title }}</span>
        </NuxtLink>
      </h2>
      <p v-if="props.article.description" class="text-sm leading-relaxed text-fg-muted">
        {{ props.article.description }}
      </p>
    </header>

    <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
      <span v-if="props.article.date" class="inline-flex items-center gap-1">
        <Icon name="line-md:calendar" class="h-3.5 w-3.5" />
        <span>发表于 {{ props.article.date }}</span>
      </span>
      <span v-if="props.article.readingMinutes" class="inline-flex items-center gap-1">
        <Icon name="line-md:document" class="h-3.5 w-3.5" />
        <span>约 {{ props.article.readingMinutes }} 分钟</span>
      </span>
      <span v-if="props.article.readingWords" class="inline-flex items-center gap-1">
        <Icon name="line-md:clipboard" class="h-3.5 w-3.5" />
        <span>共 {{ props.article.readingWords }} 字</span>
      </span>
    </div>

    <div v-if="props.article.tags.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="tag in props.article.tags"
        :key="tag"
        class="inline-flex items-center gap-1 rounded-full border border-border-muted bg-accent-subtle px-2.5 py-1 text-xs font-medium text-accent-emphasis"
      >
        <Icon name="line-md:hash" class="h-3 w-3" />
        <span>{{ tag }}</span>
      </span>
    </div>
  </article>
</template>
