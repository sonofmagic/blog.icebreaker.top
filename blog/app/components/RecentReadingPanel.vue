<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'

interface RecentReadingItem {
  path: string
  title: string
  date?: string
  tags: string[]
  readingMinutes?: number
  progress?: number
  readAt?: number
}

const props = withDefaults(defineProps<{
  items: RecentReadingItem[]
  title?: string
  compact?: boolean
}>(), {
  title: '最近阅读',
  compact: false,
})

const emit = defineEmits<{
  clear: []
  restore: [items: RecentReadingItem[]]
}>()

const pendingRestoreItems = ref<RecentReadingItem[]>([])
const statusMessage = ref('')
const undoButtonRef = ref<HTMLButtonElement | null>(null)
let statusResetTimer: ReturnType<typeof setTimeout> | undefined
const panelTitleId = useId()

function clampProgress(progress?: number) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) {
    return null
  }
  return Math.min(100, Math.max(0, Math.round(progress)))
}

function formatReadAt(readAt?: number) {
  if (!readAt || !Number.isFinite(readAt)) {
    return null
  }

  const diffMs = Date.now() - readAt
  if (diffMs < 60_000) {
    return '刚刚读过'
  }

  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000))
  if (diffDays === 0) {
    return '今天读过'
  }
  if (diffDays === 1) {
    return '昨天读过'
  }
  if (diffDays < 7) {
    return `${diffDays} 天前读过`
  }
  return null
}

const displayItems = computed(() => props.items.map((item) => {
  const progress = clampProgress(item.progress)
  const hasResumableProgress = Boolean(progress && progress > 5 && progress < 95)
  return {
    ...item,
    progress,
    hasResumableProgress,
    readAtLabel: formatReadAt(item.readAt),
    linkLabel: hasResumableProgress
      ? `继续阅读《${item.title}》，上次读到 ${progress}%`
      : `打开最近阅读《${item.title}》`,
    actionLabel: hasResumableProgress ? `继续到 ${progress}%` : '继续阅读',
  }
}))

const clearLabel = computed(() => {
  const count = props.items.length
  return count > 0 ? `清空 ${count} 条最近阅读记录` : '清空最近阅读记录'
})

function scheduleStatusReset() {
  if (statusResetTimer) {
    clearTimeout(statusResetTimer)
  }
  statusResetTimer = setTimeout(() => {
    statusMessage.value = ''
    pendingRestoreItems.value = []
  }, 6500)
}

function handleClear() {
  pendingRestoreItems.value = props.items.map(item => ({
    ...item,
    tags: [...item.tags],
  }))
  statusMessage.value = `已清空 ${pendingRestoreItems.value.length} 条最近阅读记录。`
  emit('clear')
  scheduleStatusReset()

  if (!import.meta.client) {
    return
  }

  window.requestAnimationFrame(() => {
    undoButtonRef.value?.focus({ preventScroll: true })
  })
}

async function handleUndoClear() {
  if (pendingRestoreItems.value.length === 0) {
    return
  }

  emit('restore', pendingRestoreItems.value)
  statusMessage.value = '最近阅读记录已恢复。'
  pendingRestoreItems.value = []
  scheduleStatusReset()

  await nextTick()
  if (!import.meta.client) {
    return
  }
  window.requestAnimationFrame(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  })
}

onBeforeUnmount(() => {
  if (statusResetTimer) {
    clearTimeout(statusResetTimer)
  }
})
</script>

<template>
  <section
    v-if="items.length || statusMessage"
    class="recent-reading"
    :class="{ 'recent-reading--compact': compact }"
    :aria-labelledby="panelTitleId"
  >
    <div v-if="items.length" class="recent-reading__header">
      <h2 :id="panelTitleId" class="recent-reading__label">
        <UIcon name="i-lucide-history" class="size-4 text-[--gh-accent-emphasis]" />
        {{ title }}
      </h2>
      <button
        type="button"
        class="recent-reading__clear"
        :aria-label="clearLabel"
        :title="clearLabel"
        @click="handleClear"
      >
        清空
      </button>
    </div>
    <h2 v-else :id="panelTitleId" class="sr-only">
      {{ title }}
    </h2>

    <div
      v-if="statusMessage"
      class="recent-reading__status"
      role="status"
      aria-live="polite"
    >
      <span>{{ statusMessage }}</span>
      <button
        v-if="pendingRestoreItems.length"
        ref="undoButtonRef"
        type="button"
        class="recent-reading__undo"
        aria-label="撤销清空最近阅读记录"
        @click="handleUndoClear"
      >
        撤销
      </button>
    </div>

    <div v-if="items.length" class="recent-reading__grid" role="list">
      <div
        v-for="item in displayItems"
        :key="item.path"
        class="recent-reading__item"
        role="listitem"
      >
        <ULink
          :to="item.path"
          class="recent-reading__card group"
          :aria-label="item.linkLabel"
          :title="item.linkLabel"
        >
          <div class="recent-reading__meta">
            <span>{{ item.date || '未记录日期' }}</span>
            <span class="recent-reading__meta-extra">
              <span v-if="item.readAtLabel">{{ item.readAtLabel }}</span>
              <span v-if="item.readingMinutes">{{ item.readingMinutes }} 分钟</span>
            </span>
          </div>
          <h2 class="recent-reading__title">
            {{ item.title }}
          </h2>
          <div v-if="item.tags.length" class="recent-reading__tags">
            <span
              v-for="tag in item.tags.slice(0, 2)"
              :key="tag"
              class="recent-reading__tag"
              :title="tag"
            >
              {{ tag }}
            </span>
          </div>
          <div
            v-if="item.hasResumableProgress && item.progress"
            class="recent-reading__progress"
            role="progressbar"
            :aria-label="`上次读到 ${item.progress}%`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="item.progress"
          >
            <span class="recent-reading__progress-label">
              {{ item.actionLabel }}
            </span>
            <span class="recent-reading__progress-track" aria-hidden="true">
              <span
                class="recent-reading__progress-bar"
                :style="{ width: `${item.progress}%` }"
              />
            </span>
          </div>
          <div v-else class="recent-reading__action">
            <span>{{ item.actionLabel }}</span>
            <UIcon name="i-lucide-arrow-right" class="size-4" />
          </div>
        </ULink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.recent-reading {
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  background: var(--panel-bg);
  padding: 1rem 0.75rem;
}

.recent-reading--compact {
  padding: 1rem;
}

.recent-reading__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.recent-reading__label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: color-mix(in srgb, var(--muted) 86%, transparent);
  font-size: 0.65rem;
  font-weight: 650;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.recent-reading__clear {
  display: inline-flex;
  min-height: 2.75rem;
  min-width: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  padding: 0.5rem 1rem;
  color: var(--muted);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.recent-reading__clear:hover,
.recent-reading__clear:focus-visible {
  border-color: color-mix(in srgb, var(--gh-accent-emphasis) 50%, transparent);
  background: var(--gh-accent-subtle);
  color: var(--gh-accent-emphasis);
}

.recent-reading__clear:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 3px;
}

.recent-reading__grid {
  display: grid;
  gap: 0.75rem;
}

.recent-reading__status {
  display: flex;
  min-height: 3rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--gh-accent-emphasis) 34%, transparent);
  border-radius: 0.9rem;
  background: var(--gh-accent-subtle);
  padding: 0.75rem 1rem;
  color: var(--gh-accent-emphasis);
  font-size: 0.8rem;
  line-height: 1.6;
}

.recent-reading__undo {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--gh-accent-emphasis) 48%, transparent);
  border-radius: 999px;
  background: var(--panel-bg);
  padding: 0.45rem 0.9rem;
  color: var(--gh-accent-emphasis);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.12em;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.recent-reading__undo:hover,
.recent-reading__undo:focus-visible {
  border-color: var(--gh-accent-emphasis);
  background: color-mix(in srgb, var(--gh-accent-subtle) 70%, var(--panel-bg));
}

.recent-reading__undo:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 3px;
}

@media (min-width: 1024px) {
  .recent-reading__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .recent-reading--compact .recent-reading__grid {
    grid-template-columns: 1fr;
  }
}

.recent-reading__item {
  min-width: 0;
}

.recent-reading__card {
  display: flex;
  min-width: 0;
  min-height: 6rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--surface-border) 78%, transparent);
  border-radius: 1rem;
  background: var(--panel-bg-soft);
  padding: 0.75rem 1rem;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.recent-reading__card:hover,
.recent-reading__card:focus-visible {
  border-color: color-mix(in srgb, var(--gh-accent-emphasis) 60%, transparent);
  background: var(--gh-accent-subtle);
}

.recent-reading__card:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 3px;
}

.recent-reading__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--muted);
  font-size: 0.75rem;
}

.recent-reading__meta-extra {
  display: inline-flex;
  min-width: 0;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.recent-reading__meta-extra span + span::before {
  content: '·';
  margin-right: 0.45rem;
  color: color-mix(in srgb, var(--muted) 65%, transparent);
}

.recent-reading__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--gh-fg-default);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.45;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.recent-reading__card:hover .recent-reading__title,
.recent-reading__card:focus-visible .recent-reading__title {
  color: var(--gh-accent-emphasis);
}

.recent-reading__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.recent-reading__tag {
  max-width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: var(--panel-bg);
  padding: 0.125rem 0.5rem;
  color: var(--muted);
  font-size: 0.65rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-reading__progress {
  display: grid;
  gap: 0.35rem;
}

.recent-reading__progress-label,
.recent-reading__action {
  color: var(--gh-accent-emphasis);
  font-size: 0.7rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.recent-reading__action {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.35rem;
}

.recent-reading__progress-track {
  display: block;
  height: 0.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-border) 60%, transparent);
}

.recent-reading__progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gh-accent-emphasis);
}
</style>
