<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DarkArticleCard from '@/components/article/DarkArticleCard.vue'
import CommentArea from '@/components/comment/Area.vue'
import DarkSouls from '@/components/home/DarkSouls.vue'
import SidebarFooter from '@/components/layout/SidebarFooter.vue'
import { getPageList, type ArticlePageQuery, type ArticleSummary } from '@/api/article'

const pagination = reactive<ArticlePageQuery>({
  page: 1,
  perPage: 12,
})

const btnLoading = ref(false)
const currentIdx = ref(0)
const total = ref(0)
const articleBuckets = ref<ArticleSummary[][]>([])

const totalPage = computed(() => (pagination.perPage > 0 ? Math.ceil(total.value / pagination.perPage) : 1))

const { data: initialData } = await useAsyncData('home-initial', async () => {
  const { total: count, articles } = await getPageList(pagination)
  return { count, articles }
})

if (initialData.value) {
  total.value = initialData.value.count
  articleBuckets.value[0] = initialData.value.articles
}

const btnText = computed(() => (btnLoading.value ? 'Loading more...' : 'More'))
const hasMore = computed(() => total.value > pagination.page * pagination.perPage)

async function loadPage(pageNumber: number) {
  btnLoading.value = true
  try {
    const { total: count, articles } = await getPageList({
      page: pageNumber,
      perPage: pagination.perPage,
    })
    total.value = count
    articleBuckets.value[pageNumber - 1] = articles
  }
  finally {
    btnLoading.value = false
  }
}

async function next() {
  const nextIdx = currentIdx.value + 1
  if (nextIdx >= totalPage.value) {
    return
  }

  if (!articleBuckets.value[nextIdx]) {
    pagination.page = nextIdx + 1
    await loadPage(pagination.page)
  }

  currentIdx.value = nextIdx
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas-inset md:flex-row">
    <aside class="order-2 max-w-full border-b border-r border-border-muted bg-canvas-default md:order-1 md:w-4/12 md:max-w-[350px]">
      <div class="md:sticky md:top-[62px]">
        <div class="hover-scroll-bar h-[calc(100vh-62px)] overflow-y-auto px-4 md:px-6 lg:px-8">
          <DarkSouls />
        </div>
      </div>
    </aside>
    <div class="order-1 flex-auto px-4 md:order-2 md:w-8/12 lg:px-8">
      <div class="flex flex-col sm:-mx-6 md:flex-row">
        <div class="mt-4 px-4 md:w-full lg:w-8/12">
          <template v-for="(arr, idx) in articleBuckets" :key="idx">
            <div>
              <DarkArticleCard
                v-for="item in arr"
                :key="item.id"
                :item="item"
              />
            </div>
          </template>
          <button
            v-if="hasMore"
            class="mt-6 inline-flex items-center rounded-md border border-border-muted px-4 py-2 text-sm font-medium text-fg-default transition hover:bg-border-muted/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="btnLoading"
            @click="next"
          >
            {{ btnText }}
          </button>
          <div class="my-8">
            <SidebarFooter />
          </div>
        </div>
        <div class="mt-8 max-w-full md:w-4/12 md:px-6">
          <CommentArea />
        </div>
      </div>
    </div>
  </div>
</template>
