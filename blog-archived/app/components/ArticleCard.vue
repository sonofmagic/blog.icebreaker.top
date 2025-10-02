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
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[--surface-border]/70 bg-[--panel-bg-soft]/95 shadow-[0_28px_65px_-40px_var(--gh-shadow,rgba(15,23,42,0.45))] transition-all duration-300 hover:-translate-y-[8px] hover:border-[--surface-border]/40 hover:shadow-[0_35px_75px_-35px_var(--gh-shadow,rgba(15,23,42,0.6))]"
  >
    <span class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(94,106,255,0.12),transparent_55%)] opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
    <span class="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-[--gh-accent-emphasis]/50 to-transparent opacity-50 group-hover:opacity-80" />

    <div class="relative flex flex-1 flex-col gap-6 px-6 pb-6 pt-8">
      <div class="space-y-4">
        <div class="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-[--gh-accent-emphasis]/70">
          <span class="size-1.5 rounded-full bg-[--gh-accent-emphasis]" />
          <span>笔记</span>
        </div>

        <ULink
          :to="props.article.path"
          class="block text-lg font-semibold leading-tight tracking-tight text-[--gh-fg-default] transition-colors duration-200 hover:text-[--gh-accent-emphasis] sm:text-xl"
        >
          {{ props.article.title }}
        </ULink>

        <p v-if="props.article.description" class="line-clamp-3 text-sm leading-relaxed text-muted sm:text-base">
          {{ props.article.description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted sm:text-sm">
        <span v-if="props.article.date" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-calendar" class="size-3.5" />
          {{ props.article.date }}
        </span>
        <span v-if="props.article.readingMinutes" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          {{ props.article.readingMinutes }} 分钟
        </span>
        <span v-if="props.article.readingWords" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-type" class="size-3.5" />
          {{ props.article.readingWords }} 字
        </span>
      </div>

      <div v-if="props.article.tags.length" class="mt-auto flex flex-wrap gap-2">
        <span
          v-for="tag in props.article.tags"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full border border-[--surface-border]/80 bg-[--panel-bg] px-2.5 py-1 text-xs font-medium text-muted transition-colors duration-200 hover:border-[--gh-accent-emphasis]/60 hover:text-[--gh-accent-emphasis]"
        >
          <UIcon name="i-lucide-hash" class="size-3" />
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="relative flex items-center justify-between border-t border-[--surface-border]/70 bg-[--panel-bg] px-6 py-4 text-xs text-muted">
      <span class="inline-flex items-center gap-1">
        <UIcon name="i-lucide-arrow-up-right" class="size-3" />
        阅读全文
      </span>
      <ULink
        :to="props.article.path"
        class="inline-flex size-9 items-center justify-center rounded-full border border-transparent bg-[--gh-accent-subtle] text-[--gh-accent-emphasis] transition-colors duration-200 hover:border-[--gh-accent-emphasis] hover:bg-transparent"
        aria-label="前往文章"
      >
        <UIcon name="i-lucide-arrow-right" class="size-4" />
      </ULink>
    </div>
  </article>
</template>
