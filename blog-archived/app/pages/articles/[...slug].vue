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
  <div class="flex flex-col gap-6">
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-2 text-sm font-medium text-accent-emphasis transition-colors hover:text-accent-emphasis"
    >
      <Icon name="line-md:arrow-left" class="h-4 w-4" />
      <span>返回仪表盘</span>
    </NuxtLink>

    <article v-if="article" class="rounded-2xl border border-border-muted bg-canvas-default shadow-card">
      <header class="border-b border-border-muted px-8 py-8">
        <p class="text-xs uppercase tracking-[0.24em] text-fg-subtle">精选洞察</p>
        <h1 class="mt-2 text-3xl font-semibold text-fg-default">
          {{ article.title || '未命名文章' }}
        </h1>
        <p v-if="article.description" class="mt-3 text-sm leading-relaxed text-fg-muted">
          {{ article.description }}
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-fg-subtle">
          <span v-if="article.date" class="inline-flex items-center gap-1">
            <Icon name="line-md:calendar" class="h-3.5 w-3.5" />
            <span>发布日期 {{ article.date }}</span>
          </span>
          <span v-if="article.readingMinutes" class="inline-flex items-center gap-1">
            <Icon name="line-md:document" class="h-3.5 w-3.5" />
            <span>阅读时间约 {{ article.readingMinutes }} 分钟</span>
          </span>
          <span v-if="article.readingWords" class="inline-flex items-center gap-1">
            <Icon name="line-md:clipboard" class="h-3.5 w-3.5" />
            <span>全文 {{ article.readingWords }} 字</span>
          </span>
        </div>
      </header>

      <div class="px-8 pb-8 pt-6">
        <ContentRenderer :value="article" class="article-body prose max-w-none" />
      </div>
    </article>

    <p v-else class="rounded-xl border border-border-muted bg-canvas-default px-4 py-10 text-center text-sm text-fg-muted">
      正在加载内容，请稍候。
    </p>
  </div>
</template>
