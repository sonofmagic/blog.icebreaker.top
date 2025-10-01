<script setup lang="ts">
import { computed } from 'vue'
import { createError, queryContent, useRoute, useRuntimeConfig, useSeoMeta } from '#imports'
import CommentArea from '@/components/comment/Area.vue'
import Tags from '@/components/global/Tags.vue'

definePageMeta({
  layout: 'article',
})

const route = useRoute()
const year = route.params.year as string
const month = route.params.month as string
const slug = route.params.slug as string
const path = `/articles/${year}/${month}/${slug}`

const { data: article } = await useAsyncData(`article-${path}`, async () => {
  const entry = await queryContent(path).findOne()
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Article not found' })
  }
  return entry
})

useSeoMeta(() => ({
  title: article.value?.title ? `${article.value.title}_icebreaker` : 'icebreaker',
  description: article.value?.description,
}))

const toc = computed(() => article.value?.body?.toc?.links ?? article.value?.toc ?? [])
const tags = computed(() => article.value?.tags ?? [])
const runtimeConfig = useRuntimeConfig()
const href = computed(() => `${runtimeConfig.public.siteUrl || 'https://icebreaker.top'}${route.fullPath}`)

function scrollTo(id: string) {
  if (!id) {
    return
  }
  const element = document.getElementById(id)
  if (element) {
    window.scrollTo({
      top: element.offsetTop + 81,
      behavior: 'smooth',
    })
  }
}
</script>

<template>
  <div class="container mx-auto max-w-screen-xl">
    <div class="flex flex-col py-6 lg:flex-row">
      <div id="article-left-menu" ref="leftMenu" class="hidden sm:mb-4 sm:inline-block lg:mr-4 lg:grow">
        <div class="sticky top-20 flex sm:block">
          <div class="mb-4">
            <NuxtLink
              class="inline-block w-full rounded-md border border-solid border-border-default bg-canvas-default p-1.5 text-xl font-semibold text-accent-fg hover:bg-canvas-subtle"
              to="/"
              replace
            >
              回到上一级
            </NuxtLink>
          </div>
          <div v-for="t in toc" :key="t.id" :title="t.text" class="truncate py-2 lg:w-32">
            <a
              class="cursor-pointer transition-colors duration-200 hover:text-green-500 hover:underline"
              :href="`#${t.id}`"
              @click.prevent="scrollTo(t.id)"
            >
              {{ t.text }}
            </a>
          </div>
        </div>
      </div>

      <div
        class="relative m-auto mb-4 w-full p-4 shadow ring-0 ring-gray-200 dark:ring-gray-700 sm:max-w-full sm:rounded-lg sm:px-8 sm:shadow sm:ring-1 lg:mb-0 lg:max-w-5xl"
      >
        <div class="mb-2">
          <h1 class="mb-2 text-3xl">
            {{ article?.title }}
          </h1>
          <div class="mb-2 flex flex-col space-y-1 md:flex-row md:items-center md:justify-between">
            <div>
              <Tags :tags="tags" />
            </div>

            <div class="flex md:min-w-[240px] md:justify-end">
              <div class="text-xs">
                共 {{ article?.readingWords }} 个字，阅读时间 {{ article?.readingMinutes }} 分钟
              </div>
            </div>
          </div>
        </div>
        <ContentRenderer v-if="article" class="compose-nuxt-content" :value="article" />
        <div class="text-xs">
          <div>
            版权声明：本文为博主原创文章，遵循
            <a href="http://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener" class="text-accent-fg underline">
              CC 4.0 BY-SA
            </a>
            版权协议，转载请附上原文出处链接和本声明。
          </div>
          <div class="article-source-link">
            本文链接：
            <a class="text-accent-fg underline" :href="href" target="_blank">
              {{ href }}
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full grow self-start p-4 shadow sm:w-auto">
      <CommentArea />
    </div>
  </div>
</template>

<style>
.compose-nuxt-content {
  @apply prose prose-sm prose-invert max-w-none text-fg-default antialiased sm:prose-base;
}
</style>
