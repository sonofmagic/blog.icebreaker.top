<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  code?: string
  language?: string
  filename?: string
  hideHeader?: boolean
  meta?: string
  class?: unknown
}>()

const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
const preElement = ref<HTMLElement | null>(null)
const isCodeScrollable = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined
let resizeObserver: ResizeObserver | undefined

const languageLabel = computed(() => {
  if (props.filename) {
    return props.filename
  }
  if (props.language) {
    return props.language
  }
  return 'code'
})

const copyLabel = computed(() => {
  if (copyState.value === 'copied') {
    return '已复制'
  }
  if (copyState.value === 'failed') {
    return '复制失败'
  }
  return '复制代码'
})

const codeRegionLabel = computed(() => `${languageLabel.value} 代码块`)
const copyButtonLabel = computed(() => `${copyLabel.value}：${languageLabel.value}`)

const codeClass = computed(() => {
  if (Array.isArray(props.class)) {
    return props.class
  }
  return props.class || ''
})

function scheduleReset() {
  if (resetTimer) {
    clearTimeout(resetTimer)
  }
  resetTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 2200)
}

async function copyCode() {
  if (!import.meta.client || !props.code) {
    copyState.value = 'failed'
    scheduleReset()
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.code)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = props.code
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copyState.value = 'copied'
  }
  catch {
    copyState.value = 'failed'
  }
  scheduleReset()
}

function updateCodeScrollability() {
  const element = preElement.value
  if (!element) {
    isCodeScrollable.value = false
    return
  }

  isCodeScrollable.value = element.scrollWidth > element.clientWidth + 1
}

onMounted(async () => {
  await nextTick()
  updateCodeScrollability()
  window.addEventListener('resize', updateCodeScrollability, { passive: true })

  if ('ResizeObserver' in window && preElement.value) {
    resizeObserver = new ResizeObserver(updateCodeScrollability)
    resizeObserver.observe(preElement.value)
  }
})

onBeforeUnmount(() => {
  if (resetTimer) {
    clearTimeout(resetTimer)
  }
  window.removeEventListener('resize', updateCodeScrollability)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="prose-code-block">
    <div v-if="!hideHeader" class="prose-code-block__header">
      <div class="prose-code-block__label">
        <UIcon name="i-lucide-terminal-square" class="size-4" />
        <span>{{ languageLabel }}</span>
      </div>
      <button
        type="button"
        class="prose-code-block__copy"
        :aria-label="copyButtonLabel"
        :title="copyButtonLabel"
        @click="copyCode"
      >
        <UIcon :name="copyState === 'copied' ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" />
        <span>{{ copyLabel }}</span>
      </button>
      <span
        v-if="copyState !== 'idle'"
        class="sr-only"
        role="status"
      >
        {{ copyButtonLabel }}
      </span>
    </div>
    <pre
      ref="preElement"
      class="prose-code-block__pre"
      :class="codeClass"
      :tabindex="isCodeScrollable ? 0 : undefined"
      :role="isCodeScrollable ? 'region' : undefined"
      :aria-label="isCodeScrollable ? codeRegionLabel : undefined"
      v-bind="$attrs"
    ><slot /></pre>
  </div>
</template>

<style scoped>
.prose-code-block {
  margin: 1.75rem 0;
  overflow: hidden;
  border: 1px solid var(--gh-code-border);
  border-radius: 1rem;
  background: var(--gh-code-bg);
  box-shadow: 0 18px 45px -34px rgba(15, 23, 42, 0.5);
}

.prose-code-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--gh-code-border);
  background: color-mix(in srgb, var(--panel-bg) 74%, transparent 26%);
  padding: 0.65rem 0.75rem 0.65rem 1rem;
}

.prose-code-block__label {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.prose-code-block__label span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prose-code-block__copy {
  display: inline-flex;
  min-height: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--panel-bg);
  padding: 0.55rem 0.85rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.prose-code-block__copy:hover,
.prose-code-block__copy:focus-visible {
  border-color: color-mix(in srgb, var(--gh-accent-emphasis) 70%, transparent 30%);
  background: var(--gh-accent-subtle);
  color: var(--gh-accent-emphasis);
}

.prose-code-block__copy:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 38%, transparent);
  outline-offset: 3px;
}

.prose-code-block__pre {
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background:
    linear-gradient(90deg, var(--gh-code-bg) 30%, color-mix(in srgb, var(--gh-code-bg) 0%, transparent)) left center /
      1rem 100% no-repeat,
    linear-gradient(270deg, var(--gh-code-bg) 30%, color-mix(in srgb, var(--gh-code-bg) 0%, transparent)) right center /
      1rem 100% no-repeat,
    linear-gradient(90deg, rgba(15, 23, 42, 0.18), transparent) left center / 0.75rem 100% no-repeat,
    linear-gradient(270deg, rgba(15, 23, 42, 0.18), transparent) right center / 0.75rem 100% no-repeat,
    var(--gh-code-bg);
  background-attachment: local, local, scroll, scroll, scroll;
}

.prose-code-block__pre:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 50%, transparent);
  outline-offset: -4px;
}

@media (max-width: 640px) {
  .prose-code-block__header {
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 0.65rem 0.75rem;
  }

  .prose-code-block__label {
    flex: 1 1 12rem;
  }

  .prose-code-block__copy {
    min-height: 2.75rem;
    min-width: 2.75rem;
    justify-content: center;
    padding-inline: 0.65rem;
  }

  .prose-code-block__copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
