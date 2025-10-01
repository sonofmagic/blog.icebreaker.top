<script setup lang="ts">
import { computed } from 'vue'
import { createError, queryContent, useRoute, useSeoMeta } from '#imports'
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

const route = useRoute()
const slug = route.params.slug as string

const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  const entry = await queryContent<ParsedContent>(`/articles/${slug}`).findOne()
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Article not found' })
  }
  return entry
})

const { data: authors } = await useAsyncData(`article-authors-${slug}`, async () => {
  if (!article.value?.authors || !Array.isArray(article.value.authors)) {
    return []
  }
  return queryContent('/authors')
    .where({ slug: { $in: article.value.authors } })
    .find()
})

const { data: surround } = await useAsyncData(`article-surround-${slug}`, async () => {
  if (!article.value?._path) {
    return { prev: null, next: null }
  }
  const [prev, next] = await queryContent('/articles')
    .only(['title', '_path'])
    .sort({ date: -1 })
    .findSurround(article.value._path)
  return { prev, next }
})

useSeoMeta(() => ({
  title: article.value?.title,
  description: article.value?.description,
}))

const prevArticle = computed(() => surround.value?.prev || null)
const nextArticle = computed(() => surround.value?.next || null)
</script>

<template>
  <div class="container mx-auto">
    <NuxtLink to="/articles">
      Articles
    </NuxtLink>
    <h2>{{ article?.title }}</h2>
    <div v-for="author of authors" :key="author.slug" class="flex items-center space-x-2">
      <img :src="author.avatarUrl" width="50" height="50" alt="author avatar">
      <span>{{ author.name }}</span>
    </div>
    <ContentRenderer v-if="article" :value="article" />
    <div class="mt-6 flex items-center justify-between text-sm">
      <NuxtLink v-if="prevArticle" :to="prevArticle._path">
        &lt; {{ prevArticle.title }}
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="nextArticle" :to="nextArticle._path">
        {{ nextArticle.title }} &gt;
      </NuxtLink>
    </div>
  </div>
</template>
