<script setup lang="ts">
import type { NuxtError } from '#app'
import { computed } from 'vue'
import RecentReadingPanel from '@/components/RecentReadingPanel.vue'

const { error } = defineProps<{ error: NuxtError }>()
const { recentItems, clearReadingHistory, restoreReadingHistory } = useReadingHistory()

const statusCode = computed(() => error?.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)

const eyebrow = computed(() => (isNotFound.value ? 'Not found' : 'Something broke'))
const title = computed(() => (isNotFound.value ? '这篇内容暂时找不到' : '页面暂时无法打开'))
const description = computed(() => {
  if (isNotFound.value) {
    return '链接可能已经移动，或者文章尚未发布。可以回到归档继续查找。'
  }
  return '这通常是临时问题。你可以返回归档，或稍后刷新页面再试。'
})

const statusMessage = computed(() => {
  const message = error?.message || error?.statusMessage
  return typeof message === 'string' && message.trim().length > 0 ? message : null
})

useSiteSeo(() => ({
  title: `${statusCode.value} 错误`,
  description: description.value,
  noindex: true,
}))

function goBack() {
  if (!import.meta.client || window.history.length <= 1) {
    clearError({ redirect: '/' })
    return
  }
  window.history.back()
}
</script>

<template>
  <div class="app-shell px-4 py-6 text-[--gh-fg-default] antialiased sm:px-6">
    <a href="#main-content" class="skip-link">
      跳到正文
    </a>

    <main
      id="main-content"
      tabindex="-1"
      class="app-main mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl items-center py-10"
    >
      <section class="app-card app-card-static w-full rounded-3xl p-6 sm:p-8 lg:p-10">
        <div class="flex flex-col gap-7">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted">
              <UBadge variant="soft" color="primary" class="text-[0.65rem] uppercase tracking-[0.25em]">
                {{ eyebrow }}
              </UBadge>
              <span>{{ statusCode }}</span>
            </div>
            <NuxtLink
              to="/"
              class="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:text-[--gh-accent-emphasis] focus-visible:bg-[--gh-accent-subtle] focus-visible:text-[--gh-accent-emphasis] focus-visible:outline-none"
              aria-label="回到 icebreaker / notes 文章归档"
            >
              <UIcon name="i-lucide-home" class="size-4" />
              icebreaker / notes
            </NuxtLink>
          </div>

          <div class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-[0.32em] text-[--gh-accent-emphasis]">
              {{ statusCode }} error
            </p>
            <h1 class="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[--gh-fg-default] sm:text-4xl">
              {{ title }}
            </h1>
            <p class="max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {{ description }}
            </p>
          </div>

          <div
            v-if="statusMessage"
            class="rounded-2xl border border-[--surface-border]/70 bg-[--panel-bg-soft] px-4 py-3 text-sm leading-6 text-muted"
            role="alert"
          >
            {{ statusMessage }}
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <UButton
              to="/"
              icon="i-lucide-archive"
              size="lg"
              class="min-h-11 justify-center rounded-full"
              aria-label="回到文章归档继续浏览"
            >
              回到文章归档
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-arrow-left"
              size="lg"
              class="min-h-11 justify-center rounded-full border border-[--surface-border]/70"
              aria-label="返回上一页，如果没有历史记录则回到文章归档"
              @click="goBack"
            >
              返回上一页
            </UButton>
          </div>
        </div>

        <ClientOnly>
          <RecentReadingPanel
            :items="recentItems"
            title="最近阅读"
            compact
            @clear="clearReadingHistory"
            @restore="restoreReadingHistory"
          />
        </ClientOnly>
      </section>
    </main>
  </div>
</template>
