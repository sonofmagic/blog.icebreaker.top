<script setup lang="ts">
const route = useRoute()
const slugParam = route.params.slug
const slugSegments = Array.isArray(slugParam) ? slugParam : [slugParam].filter(Boolean)

const contentPath = slugSegments.length ? `/articles/${slugSegments.join('/')}` : null

if (!contentPath) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
}

function parseMeta(entry: Record<string, any>) {
  if (typeof entry.meta === 'string') {
    try {
      return JSON.parse(entry.meta) as Record<string, any>
    }
    catch {
      return {}
    }
  }
  if (entry.meta && typeof entry.meta === 'object') {
    return entry.meta as Record<string, any>
  }
  return {}
}

const { data: article } = await useAsyncData(`article:${contentPath}`, async () => {
  const entry = await queryCollection('articles')
    .select('id', 'title', 'description', 'path', 'body', 'meta')
    .path(contentPath)
    .first()
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在' })
  }
  const meta = parseMeta(entry)
  let body = entry.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    }
    catch {
      body = null
    }
  }
  return {
    ...entry,
    ...meta,
    body,
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6">
    <div class="flex items-center justify-between gap-3">
      <UButton
        to="/"
        variant="ghost"
        icon="i-lucide-arrow-left"
        class="w-fit rounded-full border border-transparent px-3 py-2 text-sm sm:px-4"
      >
        返回首页
      </UButton>

      <div v-if="article" class="flex flex-wrap items-center gap-3 text-xs text-muted sm:text-sm">
        <span v-if="article.date" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-calendar" class="size-3.5" />
          {{ article.date }}
        </span>
        <span v-if="article.readingMinutes" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-timer" class="size-3.5" />
          {{ article.readingMinutes }} 分钟
        </span>
        <span v-if="article.readingWords" class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-type" class="size-3.5" />
          {{ article.readingWords }} 字
        </span>
      </div>
    </div>

    <ContentRenderer v-if="article" :value="article" />

    <UAlert
      v-else
      color="primary"
      variant="soft"
      icon="i-lucide-loader-2"
      class="animate-pulse text-sm sm:text-base"
    >
      正在加载文章…
    </UAlert>
  </div>
</template>
