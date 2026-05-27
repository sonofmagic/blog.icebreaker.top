<script setup lang="ts">
import { computed } from 'vue'

interface ArticleSummary {
  path: string
  title: string
  description?: string
  date?: string
  tags: string[]
  readingMinutes?: number
  readingWords?: number
  rank: number
}

const props = defineProps<{ article: ArticleSummary }>()
const emit = defineEmits<{
  selectTag: [tag: string]
}>()
const router = useRouter()

const rankLabel = computed(() => props.article.rank.toString().padStart(2, '0'))
const formattedDate = computed(() => props.article.date ?? '尚未记录')
const readingMeta = computed(() => {
  const meta: string[] = []
  if (props.article.readingMinutes) {
    meta.push(`${props.article.readingMinutes} 分钟阅读`)
  }
  if (props.article.readingWords) {
    meta.push(`${props.article.readingWords} 字`)
  }
  return meta.join(' · ')
})
const topTags = computed(() => props.article.tags.slice(0, 3))

function selectTag(tag: string) {
  emit('selectTag', tag)
}

function openArticleFromCard(event: MouseEvent) {
  const target = event.target
  if (target instanceof Element && target.closest('a, button')) {
    return
  }
  void router.push(props.article.path)
}
</script>

<template>
  <article class="card group" @click="openArticleFromCard">
    <header class="card__header">
      <div class="card__identity">
        <span class="card__rank">{{ rankLabel }}</span>
        <span class="card__date">{{ formattedDate }}</span>
      </div>
      <span v-if="readingMeta" class="card__meta">{{ readingMeta }}</span>
    </header>

    <div class="card__body">
      <ULink :to="props.article.path" class="card__title" :title="props.article.title">
        {{ props.article.title }}
      </ULink>
      <p v-if="props.article.description" class="card__excerpt" :title="props.article.description">
        {{ props.article.description }}
      </p>
      <p v-else class="card__excerpt card__excerpt--muted">
        暂无简介，欢迎直接阅读。
      </p>

      <div v-if="topTags.length" class="card__tags">
        <button
          v-for="tag in topTags"
          :key="tag"
          type="button"
          class="card__tag"
          :aria-label="`筛选标签：${tag}`"
          :title="`筛选标签：${tag}`"
          @click="selectTag(tag)"
        >
          {{ tag }}
        </button>
        <span
          v-if="props.article.tags.length > topTags.length"
          class="card__tag card__tag--extra"
          :title="props.article.tags.slice(topTags.length).join('、')"
        >
          +{{ props.article.tags.length - topTags.length }}
        </span>
      </div>
    </div>

    <footer class="card__footer">
      <div class="card__footer-copy">
        <span class="card__footer-label">继续阅读</span>
      </div>
      <span class="card__cta" aria-hidden="true">
        阅读全文
        <UIcon name="i-lucide-arrow-right" class="size-4" />
      </span>
    </footer>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--surface-border) 90%, transparent 10%);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--panel-bg) 94%, transparent 6%),
    color-mix(in srgb, var(--panel-bg) 92%, transparent 8%)
  );
  padding: 1.75rem;
  box-shadow: 0 24px 60px -42px rgba(15, 23, 42, 0.55);
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at 20% 20%,
    color-mix(in srgb, var(--gh-accent-emphasis) 18%, transparent) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 80px -38px rgba(15, 23, 42, 0.6);
  border-color: color-mix(in srgb, var(--surface-border) 70%, transparent 30%);
}

.card:hover::before {
  opacity: 0.9;
}

.card__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: color-mix(in srgb, var(--gh-fg-default) 65%, transparent 35%);
}

.card__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gh-accent-subtle) 75%, transparent 25%);
  color: var(--gh-accent-emphasis);
  font-weight: 600;
  letter-spacing: 0.2em;
}

.card__date {
  font-weight: 500;
}

.card__meta {
  white-space: nowrap;
  color: color-mix(in srgb, var(--gh-fg-default) 55%, transparent 45%);
}

.card__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card__title {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--gh-fg-default);
  transition: color 0.2s ease;
}

.card__title::after {
  content: '';
  position: absolute;
  inset: -10rem -2rem;
  z-index: -1;
  pointer-events: none;
}

.card__title:hover,
.card__title:focus-visible {
  color: var(--gh-accent-emphasis);
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 4px;
}

.card__excerpt {
  font-size: 0.95rem;
  color: color-mix(in srgb, var(--gh-fg-default) 70%, transparent 30%);
  line-height: 1.7;
}

.card__excerpt--muted {
  font-style: italic;
  color: color-mix(in srgb, var(--gh-fg-default) 55%, transparent 45%);
}

.card__tags {
  position: relative;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.75rem;
}

.card__tag {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-bg) 90%, transparent 10%);
  border: 1px solid color-mix(in srgb, var(--surface-border) 85%, transparent 15%);
  color: color-mix(in srgb, var(--gh-fg-default) 65%, transparent 35%);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

button.card__tag {
  cursor: pointer;
}

button.card__tag:hover,
button.card__tag:focus-visible {
  border-color: color-mix(in srgb, var(--gh-accent-emphasis) 70%, transparent 30%);
  background: color-mix(in srgb, var(--gh-accent-subtle) 72%, transparent 28%);
  color: var(--gh-accent-emphasis);
}

button.card__tag:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 3px;
}

.card__tag--extra {
  border-style: dashed;
}

.card__footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--surface-border) 80%, transparent 20%);
  padding-top: 1.1rem;
}

.card__footer-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.card__footer-label {
  font-size: 0.6rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--gh-fg-default) 55%, transparent 45%);
}

.card__cta {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--surface-border) 80%, transparent 20%);
  color: var(--gh-accent-emphasis);
  font-weight: 600;
  pointer-events: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.card:hover .card__cta,
.card:focus-within .card__cta {
  background: color-mix(in srgb, var(--gh-accent-subtle) 70%, transparent 30%);
  border-color: var(--gh-accent-emphasis);
}

@media (max-width: 640px) {
  .card {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card:hover {
    transform: none;
  }
}

@media (min-width: 768px) {
  .card__title {
    font-size: 1.375rem;
  }

  .card__excerpt {
    font-size: 1rem;
  }
}
</style>
