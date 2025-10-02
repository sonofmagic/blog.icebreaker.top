<script setup lang="ts">
import { computed } from 'vue'
import { createError, queryCollection, queryCollectionItemSurroundings, useRoute, useSeoMeta } from '#imports'

const route = useRoute()
const slug = route.params.slug as string
const contentPath = `/articles/${slug}`

const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  const entry = await queryCollection('articles').path(contentPath).first()
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Article not found' })
  }
  return entry
})

const { data: authors } = await useAsyncData(`article-authors-${slug}`, async () => {
  const authorSlugs = article.value?.authors
  if (!Array.isArray(authorSlugs) || authorSlugs.length === 0) {
    return []
  }
  return queryCollection('authors')
    .andWhere(group => group.where('slug', 'IN', authorSlugs))
    .select('slug', 'name', 'avatarUrl')
    .all()
})

const { data: surround } = await useAsyncData(`article-surround-${slug}`, async () => {
  if (!article.value?.path) {
    return { prev: null, next: null }
  }
  const [prev, next] = await queryCollectionItemSurroundings('articles', article.value.path, {
    fields: ['title', 'path'],
  })
  return { prev: prev ?? null, next: next ?? null }
})

useSeoMeta(() => ({
  title: typeof article.value?.title === 'string' ? article.value.title : undefined,
  description: typeof article.value?.description === 'string' ? article.value.description : undefined,
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
      <NuxtLink v-if="prevArticle" :to="prevArticle.path">
        &lt; {{ prevArticle.title }}
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="nextArticle" :to="nextArticle.path">
        {{ nextArticle.title }} &gt;
      </NuxtLink>
    </div>
  </div>
</template>
