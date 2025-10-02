<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { getPageList, searchArticles, type ArticleSummary } from '@/api/article'

const route = useRoute()
const router = useRouter()

const searchTerm = ref(typeof route.query.q === 'string' ? route.query.q : '')

async function fetchArticles(): Promise<ArticleSummary[]> {
  if (!searchTerm.value) {
    const { articles } = await getPageList({ page: 1, perPage: 1000 })
    return articles
  }
  return searchArticles(searchTerm.value)
}

const { data: articles, refresh } = await useAsyncData('articles-list', fetchArticles, {
  watch: [searchTerm],
})

watch(searchTerm, (value) => {
  router.replace({ query: value ? { q: value } : {} })
}, { flush: 'post' })

const hasResults = computed(() => (articles.value?.length ?? 0) > 0)
</script>

<template>
  <div>
    <NuxtLink to="/">
      Home
    </NuxtLink>
    <h2>Nuxt Blog</h2>

    <input id="search" v-model="searchTerm" placeholder="Search...">

    <ul v-if="hasResults">
      <li v-for="article in articles" :key="article.id">
        <NuxtLink :to="article.path">
          {{ article.title }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-fg-muted">
      No articles found.
    </p>
  </div>
</template>
