<script setup lang="ts">
import type { ArticleSummary } from '@/api/article'
import { queryContent, useRoute } from '#imports'
import { computed } from 'vue'

const route = useRoute()
const year = computed(() => route.params.year as string)
const month = computed(() => route.params.month as string)

const { data: articles } = await useAsyncData(`articles-${year.value}-${month.value}`, async () => {
  const list = await queryContent(`/articles/${year.value}/${month.value}`)
    .sort({ date: -1 })
    .select(['_id', '_path', 'title', 'description', 'date', 'tags'])
    .find()

  return list.map<ArticleSummary>((article: any) => ({
    id: article._id || article._path || '',
    path: article._path || '/',
    title: article.title || 'Untitled',
    description: article.description,
    date: article.date,
    tags: article.tags || [],
  }))
})

const articleList = computed(() => articles.value ?? [])
</script>

<template>
  <div>
    <NuxtLink to="/articles">
      Articles
    </NuxtLink>
    <h2>{{ year }}/{{ month }}</h2>

    <ul>
      <li v-for="article in articleList" :key="article.id">
        <NuxtLink :to="article.path">
          {{ article.title }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
