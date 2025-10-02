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
  <div>
    <UButton to="/" variant="ghost" icon="i-lucide-arrow-left" class="w-fit rounded-full border border-transparent px-4">
      返回首页
    </UButton>

    <UCard v-if="article" variant="ghost" class="app-card rounded-3xl p-6 md:p-8">
      <template #header>
        <div class="space-y-4">
          <UBadge variant="soft" color="primary">
            精选文章
          </UBadge>
          <UHeading tag="h1" size="xl" weight="semibold" class="tracking-tight">
            {{ article.title || '未命名文章' }}
          </UHeading>
          <p v-if="article.description" class="text-sm text-muted">
            {{ article.description }}
          </p>
          <div class="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span v-if="article.date" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              发布于 {{ article.date }}
            </span>
            <span v-if="article.readingMinutes" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-timer" class="size-3.5" />
              约 {{ article.readingMinutes }} 分钟
            </span>
            <span v-if="article.readingWords" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-type" class="size-3.5" />
              共 {{ article.readingWords }} 字
            </span>
          </div>
          <div v-if="article.tags?.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="tag in article.tags"
              :key="tag"
              variant="soft"
              color="primary"
              size="sm"
              class="gap-1"
            >
              <UIcon name="i-lucide-hash" class="size-3" />
              {{ tag }}
            </UBadge>
          </div>
        </div>
      </template>

      <ContentRenderer :value="article" />
    </UCard>

    <UAlert v-else color="primary" variant="soft" icon="i-lucide-loader-2" class="animate-pulse">
      正在加载文章…
    </UAlert>
  </div>
</template>
