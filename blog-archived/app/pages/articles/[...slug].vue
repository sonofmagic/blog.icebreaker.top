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
  <main class="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
    <NuxtLink to="/" class="text-sm text-accent-emphasis hover:underline">
      ← 返回首页
    </NuxtLink>

    <article v-if="article" class="mt-6 space-y-6">
      <header class="space-y-2">
        <h1 class="text-3xl font-bold text-fg-default">
          {{ article.title || '未命名文章' }}
        </h1>
        <p v-if="article.description" class="text-sm text-fg-muted">
          {{ article.description }}
        </p>
        <div class="flex flex-wrap gap-3 text-xs text-fg-muted">
          <span v-if="article.date">发表于 {{ article.date }}</span>
          <span v-if="article.readingMinutes">约 {{ article.readingMinutes }} 分钟</span>
          <span v-if="article.readingWords">共 {{ article.readingWords }} 字</span>
        </div>
      </header>

      <ContentRenderer :value="article" class="prose max-w-none" />
    </article>

    <p v-else class="mt-20 text-center text-sm text-fg-muted">
      正在加载文章…
    </p>
  </main>
</template>
