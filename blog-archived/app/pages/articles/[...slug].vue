<script setup lang="ts">
import type { MarkdownRoot } from '@nuxt/content'
import ArticleTocList from '@/components/ArticleTocList.vue'

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

interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

function gatherNodeText(node: any): string {
  if (!node || typeof node !== 'object') {
    return ''
  }
  if (typeof node.value === 'string') {
    return node.value
  }
  if (Array.isArray(node.children)) {
    return node.children.map(
      child => gatherNodeText(child),
    ).join('')
  }
  return ''
}

function extractFirstParagraphText(body: any): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined
  }
  const nodes = Array.isArray(body.children) ? body.children : []
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const isParagraph = node.tag === 'p' || (node.type === 'element' && node.tag === 'p')
    if (isParagraph) {
      const text = gatherNodeText(node).trim()
      if (text) {
        return text.replace(/\s+/g, ' ')
      }
    }
  }
  return undefined
}

function buildTocLinksFromBody(body: MarkdownRoot | undefined | null): TocLink[] {
  const children = Array.isArray(body?.children) ? body!.children : []
  const links: TocLink[] = []
  const stack: Array<{ depth: number, link: TocLink }> = []

  for (const node of children) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const tag = typeof (node as any).tag === 'string' ? (node as any).tag : null
    if (!tag || !tag.startsWith('h')) {
      continue
    }

    const depth = Number.parseInt(tag.slice(1), 10)
    if (!Number.isFinite(depth) || depth < 2) {
      continue
    }

    const id = typeof (node as any).props?.id === 'string' ? (node as any).props.id : null
    if (!id) {
      continue
    }

    const text = gatherNodeText(node).trim()
    if (!text) {
      continue
    }

    const link: TocLink = {
      id,
      depth,
      text,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      links.push(link)
    }
    else {
      const parent = stack[stack.length - 1]!.link
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(link)
    }

    stack.push({ depth, link })
  }

  function normalize(nodes: TocLink[]): TocLink[] {
    return nodes.map((node) => {
      if (node.children && node.children.length === 0) {
        delete node.children
      }
      else if (node.children) {
        node.children = normalize(node.children)
      }
      return node
    })
  }

  return normalize(links)
}

const { data: article } = await useAsyncData(`article:${contentPath}`, async () => {
  const entry = await queryCollection('articles')
    .path(contentPath)
    .first()

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在' })
  }
  const meta = parseMeta(entry)
  let body: null | MarkdownRoot = entry.body
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

const { data: adjacent } = await useAsyncData(`article-nav:${contentPath}`, async () => {
  const entries = await queryCollection('articles')
    .all()

  const list = (Array.isArray(entries) ? entries : [])
    .map(entry => ({
      ...entry,
      ...parseMeta(entry),
    }))
    .filter(entry => entry.draft !== true)
    .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())

  const currentIndex = list.findIndex(entry => entry.path === contentPath)
  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const older = list[currentIndex + 1] ?? null
  const newer = list[currentIndex - 1] ?? null

  const mapEntry = (entry: any) => entry
    ? {
        path: entry.path,
        title: typeof entry.title === 'string' && entry.title.length > 0 ? entry.title : '未命名',
      }
    : null

  return {
    prev: mapEntry(older),
    next: mapEntry(newer),
  }
})

const tocLinks = computed<TocLink[]>(() => {
  const rawLinks = article.value?.body?.toc?.links
  if (Array.isArray(rawLinks) && rawLinks.length > 0) {
    return rawLinks as TocLink[]
  }
  return buildTocLinksFromBody(article.value?.body)
})
const hasToc = computed(() => tocLinks.value.length > 0)
const isTocOpen = ref(false)
const previousArticle = computed(() => adjacent.value?.prev ?? null)
const nextArticle = computed(() => adjacent.value?.next ?? null)

const articleSeo = computed(() => {
  const record = article.value as Record<string, any> | null
  if (!record) {
    return {
      title: '文章不存在',
      description: '文章不存在或已被移动。',
      noindex: true,
      path: contentPath ?? route.path ?? '/',
    }
  }

  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : undefined

  const description = typeof record.description === 'string' && record.description.trim().length > 0
    ? record.description.trim()
    : extractFirstParagraphText(record.body)

  const imageCandidates = [record.ogImage, record.cover, record.image]
  const image = imageCandidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const publishedTime = typeof record.date === 'string' && record.date.length > 0 ? record.date : undefined
  const modifiedTime = typeof record.updatedAt === 'string' && record.updatedAt.length > 0 ? record.updatedAt : publishedTime

  return {
    title: typeof record.title === 'string' && record.title.length > 0 ? record.title : '文章详情',
    description,
    image,
    type: 'article' as const,
    publishedTime,
    modifiedTime,
    tags,
    path: record.path ?? contentPath ?? route.path ?? '/',
  }
})

useSiteSeo(articleSeo)

const tocUi = {
  root: 'lg:w-full lg:!border-none lg:!shadow-none',
  container: 'lg:gap-3',
  content: 'lg:flex lg:flex-col lg:gap-1.5 lg:!overflow-visible',
  list: 'space-y-1 text-sm text-muted leading-relaxed',
  listWithChildren: 'mt-2 space-y-1 border-l border-[--surface-border]/60 pl-3',
  item: 'max-w-full overflow-hidden',
  itemWithChildren: 'max-w-full overflow-hidden',
  link: 'block max-w-full truncate rounded-lg px-3 py-1.5 text-left transition-colors duration-150 hover:bg-[--panel-bg-soft] hover:text-[--gh-accent-emphasis]',
  linkText: 'break-words text-left',
  indicator: 'bg-[--gh-accent-subtle]',
}

function handleTocMove(_id?: string) {
  if (!import.meta.client) {
    return
  }
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  if (isTocOpen.value) {
    window.setTimeout(() => {
      isTocOpen.value = false
    }, 200)
  }
}
</script>

<template>
  <div class="relative flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
    <div class="flex flex-col gap-6">
      <UButton
        to="/"
        variant="ghost"
        icon="i-lucide-arrow-left"
        class="w-fit rounded-full border border-transparent px-3 py-2 text-sm sm:px-4"
      >
        返回首页
      </UButton>

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

      <div
        v-if="previousArticle || nextArticle"
        class="mt-10 border-t border-[--surface-border]/60 pt-6"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <ULink
            v-if="previousArticle"
            :to="previousArticle.path"
            class="group flex flex-col gap-2 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-4 transition-colors hover:border-[--gh-accent-emphasis]/60 hover:bg-[--panel-bg-soft]"
          >
            <span class="text-xs uppercase tracking-[0.28em] text-muted/70">上一篇</span>
            <span class="text-sm font-semibold leading-snug text-[--gh-fg-default] group-hover:text-[--gh-accent-emphasis]">
              {{ previousArticle.title }}
            </span>
          </ULink>

          <ULink
            v-if="nextArticle"
            :to="nextArticle.path"
            class="group flex flex-col gap-2 rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg] px-4 py-4 transition-colors hover:border-[--gh-accent-emphasis]/60 hover:bg-[--panel-bg-soft]"
          >
            <span class="text-xs uppercase tracking-[0.28em] text-muted/70">下一篇</span>
            <span class="text-sm font-semibold leading-snug text-[--gh-fg-default] group-hover:text-[--gh-accent-emphasis]">
              {{ nextArticle.title }}
            </span>
          </ULink>
        </div>
      </div>
    </div>

    <aside
      v-if="hasToc"
      class="sticky top-32 hidden h-fit max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-[--surface-border]/60 bg-[--panel-bg] p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] lg:block"
    >
      <div class="text-[0.65rem] uppercase tracking-[0.3em] text-muted/60">
        Contents
      </div>
      <h2 class="mt-2 text-sm font-semibold tracking-wide text-muted-strong">
        文章目录
      </h2>
      <div class="mt-4 -mr-2 pr-2">
        <ClientOnly fallback-tag="div">
          <UContentToc :links="tocLinks" :ui="tocUi" highlight default-open @move="handleTocMove" />

          <template #fallback>
            <ArticleTocList :links="tocLinks" :toc-ui="tocUi" />
          </template>
        </ClientOnly>
      </div>
    </aside>

    <div v-if="hasToc" class="pointer-events-none lg:hidden">
      <div class="fixed inset-x-0 bottom-5 z-40 flex justify-center pointer-events-auto">
        <UButton
          class="pointer-events-auto rounded-full border border-[--gh-accent-emphasis]/60 bg-[--gh-accent-subtle] px-5 py-2 text-sm font-medium text-[--gh-accent-emphasis] shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur transition-colors duration-150 hover:border-[--gh-accent-emphasis] hover:bg-[rgba(31,111,235,0.18)] hover:text-[--gh-accent-emphasis] dark:hover:bg-[rgba(65,132,228,0.26)]"
          size="sm"
          :icon="isTocOpen ? 'i-lucide-x' : 'i-lucide-list-tree'"
          @click="isTocOpen = !isTocOpen"
        >
          {{ isTocOpen ? '收起目录' : '目录' }}
        </UButton>
      </div>

      <div
        v-if="isTocOpen"
        class="fixed inset-0 z-30 flex flex-col justify-end bg-black/60 backdrop-blur-sm pointer-events-auto"
        @click.self="isTocOpen = false"
      >
        <div class="mx-auto mb-6 w-[min(100%-2.5rem,28rem)] max-h-[70vh] overflow-y-auto rounded-3xl border border-[--surface-border]/80 bg-[--panel-bg] p-5 shadow-[0_24px_60px_-25px_rgba(15,23,42,0.6)] pointer-events-auto">
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm font-semibold text-muted-strong">
              文章目录
            </p>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              class="text-muted"
              aria-label="关闭目录"
              @click="isTocOpen = false"
            />
          </div>
          <div>
            <ClientOnly fallback-tag="div">
              <UContentToc :links="tocLinks" :ui="tocUi" highlight default-open @move="handleTocMove" />

              <template #fallback>
                <ArticleTocList :links="tocLinks" :toc-ui="tocUi" />
              </template>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
