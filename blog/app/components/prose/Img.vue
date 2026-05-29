<script setup lang="ts">
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ImageComponent from '#build/ui-image-component'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
  width: { type: [String, Number], required: false },
  height: { type: [String, Number], required: false },
  class: { type: null, required: false },
  ui: { type: Object, required: false },
})

const refinedSrc = computed(() => {
  if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
    const base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL))
    if (base !== '/' && !props.src.startsWith(base)) {
      return joinURL(base, props.src)
    }
  }
  return props.src
})

const baseClass = computed(() => props.ui?.base || 'max-w-full rounded-xl border border-[var(--surface-border)]/60 bg-[var(--panel-bg)] shadow-[0_14px_38px_-32px_rgba(15,23,42,0.38)]')
const isPreviewOpen = ref(false)
const dialogRef = ref<HTMLElement | null>(null)
const previewStageRef = ref<HTMLElement | null>(null)
const isPreviewStageScrollable = ref(false)
let previousActiveElement: HTMLElement | null = null
let previousBodyOverflow = ''
let previewResizeObserver: ResizeObserver | undefined

const displayCaption = computed(() => {
  const alt = props.alt?.trim()
  if (!alt || /^(?:image|img|bg|background)$/i.test(alt)) {
    return ''
  }
  return alt
})

const previewLabel = computed(() => {
  return displayCaption.value ? `查看大图：${displayCaption.value}` : '查看大图'
})

function openPreview(event?: MouseEvent | KeyboardEvent) {
  if (!import.meta.client) {
    return
  }
  const trigger = event?.currentTarget
  previousActiveElement = trigger instanceof HTMLElement
    ? trigger
    : document.activeElement instanceof HTMLElement ? document.activeElement : null
  isPreviewOpen.value = true
}

function closePreview() {
  isPreviewOpen.value = false
}

function updatePreviewStageScrollability() {
  const element = previewStageRef.value
  if (!element) {
    isPreviewStageScrollable.value = false
    return
  }

  isPreviewStageScrollable.value = element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1
}

function requestPreviewStageScrollabilityUpdate() {
  if (!import.meta.client) {
    return
  }
  window.requestAnimationFrame(updatePreviewStageScrollability)
}

function getPreviewFocusableElements() {
  if (!import.meta.client || !dialogRef.value) {
    return []
  }

  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ))
    .filter(element => !element.hasAttribute('disabled') && element.offsetParent !== null)
}

function focusPreviewDialog() {
  const focusableElements = getPreviewFocusableElements()
  const firstElement = focusableElements[0]
  if (firstElement) {
    firstElement.focus()
    return
  }

  dialogRef.value?.focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePreview()
    return
  }

  if (event.key !== 'Tab' || !isPreviewOpen.value) {
    return
  }

  const focusableElements = getPreviewFocusableElements()
  if (focusableElements.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const firstElement = focusableElements[0]!
  const lastElement = focusableElements[focusableElements.length - 1]!
  const activeElement = document.activeElement

  if (!dialogRef.value?.contains(activeElement)) {
    event.preventDefault()
    firstElement.focus()
    return
  }

  if (event.shiftKey && (activeElement === firstElement || activeElement === dialogRef.value)) {
    event.preventDefault()
    lastElement.focus()
  }
  else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

watch(isPreviewOpen, async (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    focusPreviewDialog()
    updatePreviewStageScrollability()
    window.addEventListener('resize', requestPreviewStageScrollabilityUpdate, { passive: true })

    if ('ResizeObserver' in window && previewStageRef.value) {
      previewResizeObserver = new ResizeObserver(requestPreviewStageScrollabilityUpdate)
      previewResizeObserver.observe(previewStageRef.value)
    }
    return
  }

  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', requestPreviewStageScrollabilityUpdate)
  previewResizeObserver?.disconnect()
  previewResizeObserver = undefined
  isPreviewStageScrollable.value = false
  if (previousActiveElement?.isConnected) {
    previousActiveElement.focus()
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', requestPreviewStageScrollabilityUpdate)
  previewResizeObserver?.disconnect()
})
</script>

<template>
  <span class="prose-image">
    <button
      type="button"
      class="prose-image__trigger"
      :aria-label="previewLabel"
      @click="openPreview"
    >
      <component
        :is="ImageComponent"
        :src="refinedSrc"
        :alt="alt"
        :width="width"
        :height="height"
        v-bind="$attrs"
        :class="[baseClass, props.class]"
        loading="lazy"
      />
    </button>
    <span v-if="displayCaption" class="prose-image__caption">
      {{ displayCaption }}
    </span>
  </span>

  <Teleport to="body">
    <div
      v-if="isPreviewOpen"
      ref="dialogRef"
      class="prose-image-preview"
      role="dialog"
      aria-modal="true"
      :aria-label="previewLabel"
      tabindex="-1"
      @click.self="closePreview"
    >
      <button
        type="button"
        class="prose-image-preview__close"
        aria-label="关闭大图"
        @click="closePreview"
      >
        <UIcon name="i-lucide-x" class="size-5" />
      </button>
      <div
        ref="previewStageRef"
        class="prose-image-preview__stage"
        :tabindex="isPreviewStageScrollable ? 0 : undefined"
        :role="isPreviewStageScrollable ? 'region' : undefined"
        :aria-label="isPreviewStageScrollable ? '大图预览，可滚动查看' : undefined"
      >
        <component
          :is="ImageComponent"
          :src="refinedSrc"
          :alt="alt"
          :width="width"
          :height="height"
          class="prose-image-preview__image"
          loading="eager"
          @load="updatePreviewStageScrollability"
        />
        <p v-if="displayCaption" class="prose-image-preview__caption">
          {{ displayCaption }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.prose-image {
  display: block;
  max-width: 100%;
}

.prose-image__trigger {
  display: flex;
  min-height: 2.75rem;
  width: 100%;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.85rem;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: zoom-in;
  text-align: inherit;
}

.prose-image__trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 65%, transparent);
  outline-offset: 4px;
}

.prose-image__caption {
  display: block;
  margin-top: 0.65rem;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.6;
  text-align: center;
}

.prose-image-preview {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(1, 4, 9, 0.78);
  padding: max(1.25rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right))
    max(1.25rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
  backdrop-filter: blur(14px);
}

.prose-image-preview__stage {
  max-height: min(86vh, 56rem);
  max-width: min(94vw, 72rem);
  overflow: auto;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(13, 17, 23, 0.96);
  box-shadow: 0 30px 80px -36px rgba(0, 0, 0, 0.78);
}

.prose-image-preview__stage:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.72);
  outline-offset: 4px;
}

.prose-image-preview__image {
  display: block;
  max-height: 78vh;
  max-width: 100%;
  width: auto;
  height: auto;
  margin: 0 auto;
}

.prose-image-preview__caption {
  margin: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.9rem 1rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.86rem;
  line-height: 1.65;
  text-align: center;
}

.prose-image-preview__close {
  position: fixed;
  top: max(1rem, env(safe-area-inset-top));
  right: max(1rem, env(safe-area-inset-right));
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.9rem;
  background: rgba(13, 17, 23, 0.78);
  color: rgba(255, 255, 255, 0.86);
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.prose-image-preview__close:hover,
.prose-image-preview__close:focus-visible {
  border-color: rgba(255, 255, 255, 0.38);
  background: rgba(13, 17, 23, 0.95);
  color: rgba(252, 253, 255, 0.96);
}

.prose-image-preview__close:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.72);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .prose-image-preview {
    padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
      max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
  }

  .prose-image-preview__stage {
    max-height: 84vh;
    max-width: 100%;
  }

  .prose-image-preview__close {
    top: max(0.75rem, env(safe-area-inset-top));
    right: max(0.75rem, env(safe-area-inset-right));
  }
}
</style>
