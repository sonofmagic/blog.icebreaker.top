<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const tableScroll = ref<HTMLElement | null>(null)
const isScrollable = ref(false)
let resizeObserver: ResizeObserver | undefined

function updateScrollability() {
  const element = tableScroll.value
  if (!element) {
    isScrollable.value = false
    return
  }

  isScrollable.value = element.scrollWidth > element.clientWidth + 1
}

onMounted(async () => {
  await nextTick()
  updateScrollability()
  window.addEventListener('resize', updateScrollability, { passive: true })

  if ('ResizeObserver' in window && tableScroll.value) {
    resizeObserver = new ResizeObserver(updateScrollability)
    resizeObserver.observe(tableScroll.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollability)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="tableScroll"
    class="prose-table-scroll"
    :tabindex="isScrollable ? 0 : undefined"
    :role="isScrollable ? 'region' : undefined"
    :aria-label="isScrollable ? '表格，可横向滚动' : undefined"
  >
    <table class="prose-table-scroll__table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.prose-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background:
    linear-gradient(90deg, var(--panel-bg) 30%, color-mix(in srgb, var(--panel-bg) 0%, transparent)) left center / 1rem
      100% no-repeat,
    linear-gradient(270deg, var(--panel-bg) 30%, color-mix(in srgb, var(--panel-bg) 0%, transparent)) right center /
      1rem 100% no-repeat,
    linear-gradient(90deg, rgba(15, 23, 42, 0.14), transparent) left center / 0.75rem 100% no-repeat,
    linear-gradient(270deg, rgba(15, 23, 42, 0.14), transparent) right center / 0.75rem 100% no-repeat;
  background-attachment: local, local, scroll, scroll;
}

.prose-table-scroll:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gh-accent-emphasis) 50%, transparent);
  outline-offset: 3px;
}

.prose-table-scroll__table {
  width: 100%;
}
</style>
