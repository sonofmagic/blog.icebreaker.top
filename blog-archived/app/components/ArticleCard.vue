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
  <UCard
    variant="ghost"
    class="app-card h-full rounded-2xl p-5 transition hover:-translate-y-1"
  >
    <UStack :gap="3">
      <div class="flex flex-col gap-1">
        <ULink
          :to="props.article.path"
          class="flex items-center gap-2 text-base font-semibold text-muted-strong transition hover:text-[--gh-accent-emphasis]"
        >
          <UIcon name="i-lucide-file-text" class="size-4 text-[--gh-accent-emphasis]" />
          {{ props.article.title }}
        </ULink>
        <p v-if="props.article.description" class="text-sm text-muted">
          {{ props.article.description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span v-if="props.article.date" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-calendar" class="size-3.5" />
          发布于 {{ props.article.date }}
        </span>
        <span v-if="props.article.readingMinutes" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          约 {{ props.article.readingMinutes }} 分钟
        </span>
        <span v-if="props.article.readingWords" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-type" class="size-3.5" />
          共 {{ props.article.readingWords }} 字
        </span>
      </div>

      <div v-if="props.article.tags.length" class="flex flex-wrap gap-2">
        <UBadge
          v-for="tag in props.article.tags"
          :key="tag"
          variant="soft"
          size="sm"
          class="gap-1 bg-[--gh-accent-subtle] text-[--gh-accent-emphasis]"
        >
          <UIcon name="i-lucide-hash" class="size-3" />
          {{ tag }}
        </UBadge>
      </div>
    </UStack>
  </UCard>
</template>
