<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ title: string, description: string }>()
const isOpen = ref(false)
const shareState = ref<'idle' | 'copied' | 'shared' | 'printed' | 'failed'>('idle')
let shareResetTimer: ReturnType<typeof setTimeout> | undefined

const copyButtonLabel = computed(() => {
  if (shareState.value === 'copied') {
    return '已复制本文链接'
  }
  if (shareState.value === 'failed') {
    return '本文链接复制失败'
  }
  return '复制本文链接'
})

const shareButtonLabel = computed(() => {
  if (shareState.value === 'shared') {
    return '已打开系统分享'
  }
  if (shareState.value === 'copied') {
    return '已复制本文链接'
  }
  if (shareState.value === 'failed') {
    return '分享失败，已尝试复制链接'
  }
  return '分享本文'
})

const printButtonLabel = computed(() => {
  if (shareState.value === 'printed') {
    return '已打开打印'
  }
  return '打印本文'
})

const shareStatusLabel = computed(() => {
  if (shareState.value === 'shared') {
    return '已打开系统分享。'
  }
  if (shareState.value === 'copied') {
    return '已复制本文链接。'
  }
  if (shareState.value === 'printed') {
    return '已打开打印窗口。'
  }
  if (shareState.value === 'failed') {
    return '操作失败，请稍后重试。'
  }
  return ''
})

function scheduleShareStateReset() {
  if (shareResetTimer) {
    clearTimeout(shareResetTimer)
  }
  shareResetTimer = setTimeout(() => {
    shareState.value = 'idle'
  }, 2200)
}

async function writeCurrentUrlToClipboard() {
  if (!import.meta.client) {
    return false
  }

  const url = window.location.href
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    return true
  }
  catch {
    return false
  }
}

async function copyCurrentUrl() {
  shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
  scheduleShareStateReset()
}

async function shareCurrentArticle() {
  if (!import.meta.client) {
    return
  }

  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({
        title: props.title,
        text: props.description || props.title,
        url,
      })
      shareState.value = 'shared'
    }
    else {
      shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
    }
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      shareState.value = 'idle'
      return
    }
    shareState.value = await writeCurrentUrlToClipboard() ? 'copied' : 'failed'
  }
  scheduleShareStateReset()
}

async function printArticle() {
  if (!import.meta.client) {
    return
  }
  shareState.value = 'printed'
  isOpen.value = false
  await nextTick()
  window.print()
  scheduleShareStateReset()
}

const items = computed(() => [
  { label: shareButtonLabel.value, icon: 'i-lucide-share-2', onSelect: shareCurrentArticle },
  { label: copyButtonLabel.value, icon: 'i-lucide-link', onSelect: copyCurrentUrl },
  { label: printButtonLabel.value, icon: 'i-lucide-printer', onSelect: printArticle },
])
onBeforeUnmount(() => clearTimeout(shareResetTimer))
</script>

<template>
  <UDropdownMenu v-model:open="isOpen" :items="items" :content="{ align: 'end' }">
    <button type="button" class="reader-button" aria-label="更多文章操作">
      更多 <span aria-hidden="true">···</span>
    </button>
  </UDropdownMenu>
  <span class="sr-only" role="status">{{ shareStatusLabel }}</span>
</template>
