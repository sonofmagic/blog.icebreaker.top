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
const readingMetaItems = computed(() => {
  const meta: string[] = []
  if (props.article.readingMinutes) {
    meta.push(`${props.article.readingMinutes} 分钟阅读`)
  }
  if (props.article.readingWords) {
    meta.push(`${props.article.readingWords} 字`)
  }
  return meta
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
      <span v-if="readingMetaItems.length" class="card__meta">
        <span v-for="meta in readingMetaItems" :key="meta">{{ meta }}</span>
      </span>
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
      <span class="card__footer-label">打开文章</span>
      <span class="card__cta" aria-hidden="true">
        阅读
        <UIcon name="i-lucide-arrow-right" class="size-4" />
      </span>
    </footer>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 32px;
  gap: 1.5rem;
  padding: 2rem 0;
  cursor: pointer;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.2s;
}

.card:hover {
  background: var(--panel-bg-soft);
}

.card__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: var(--gh-font-mono);
  font-size: 0.65rem;
  color: var(--muted);
}

.card__identity {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.card__rank {
  font-size: 0.8rem;
  color: var(--gh-accent-emphasis);
}

.card__rank::before {
  margin-right: 0.3rem;
  content: '[';
}

.card__rank::after {
  margin-left: 0.3rem;
  content: ']';
}

.card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.card__body {
  min-width: 0;
}

.card__title {
  display: block;
  font-size: clamp(1.15rem, 1.65vw, 1.5rem);
  font-weight: 600;
  line-height: 1.55;
  color: var(--theme-fg);
  overflow-wrap: anywhere;
  transition: color 0.2s;
}

.card:hover .card__title {
  color: var(--gh-accent-emphasis);
}

.card__excerpt {
  display: -webkit-box;
  margin-top: 0.8rem;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 0.86rem;
  line-height: 1.8;
  color: var(--muted);
  -webkit-box-orient: vertical;
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  margin-top: 0.6rem;
}

.card__tag {
  max-width: 100%;
  min-height: 36px;
  font-size: 0.67rem;
  color: var(--muted);
  overflow-wrap: anywhere;
}

button.card__tag:hover {
  color: var(--gh-accent-emphasis);
}

.card__tag::before {
  color: var(--gh-accent-emphasis);
  content: '# ';
}

.card__tag--extra {
  display: inline-flex;
  align-items: center;
}

.card__footer {
  padding-top: 0.2rem;
  color: var(--gh-accent-emphasis);
}

.card__footer-label {
  display: none;
}

.card__cta {
  font-size: 0;
}

.card__cta :deep(svg) {
  width: 24px;
  height: 24px;
  transform: rotate(-45deg);
  transition: transform 0.2s;
}

.card:hover .card__cta :deep(svg) {
  transform: rotate(0);
}

@media (max-width: 640px) {
  .card {
    grid-template-columns: minmax(0, 1fr) 24px;
    gap: 0.9rem;
    padding: 1.5rem 0;
  }

  .card__header {
    flex-direction: row;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
  }

  .card__identity {
    flex-direction: row;
    gap: 1rem;
    align-items: center;
  }

  .card__meta {
    flex-direction: row;
    gap: 0.7rem;
  }
}
</style>
