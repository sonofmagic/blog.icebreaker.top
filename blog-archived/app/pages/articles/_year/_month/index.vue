<script setup lang="ts">
import { mapToArticleSummary, createArticlesQuery } from '@/api/article'
import { useRoute } from '#imports'
import { computed } from 'vue'

const route = useRoute()
const year = computed(() => route.params.year as string)
const month = computed(() => route.params.month as string)

const { data: articles } = await useAsyncData(`articles-${year.value}-${month.value}`, async () => {
  const prefix = `/articles/${year.value}/${month.value}`
  const list = await createArticlesQuery()
    .andWhere(group => group.where('path', 'LIKE', `${prefix}/%`))
    .select('id', 'path', 'title', 'description', 'date', 'tags')
    .order('date', 'DESC')
    .all()

  return list.map(mapToArticleSummary)
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
