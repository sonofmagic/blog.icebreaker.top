<script setup lang="ts">
import { computed } from 'vue'
import Tags from '@/components/global/Tags.vue'
import { formatTimespan } from '@/utils/datetime'
import type { ArticleSummary } from '@/api/article'

interface Props {
  item: ArticleSummary
}

const props = defineProps<Props>()

const publishedAgo = computed(() => (props.item.date ? formatTimespan(props.item.date) : ''))
</script>

<template>
  <div class="ice-card">
    <span class="mr-2 flex-shrink-0">
      <OutSideLink
        class="inline-block"
        href="https://github.com/sonofmagic"
        raw
      >
        <img
          width="32"
          height="32"
          class="flex-shrink-0 rounded-full"
          src="@/assets/img/avatar.jpg"
          alt="icebreaker"
        >
      </OutSideLink>
    </span>
    <div class="flex flex-1 flex-col pt-1">
      <div class="flex items-baseline justify-between">
        <div>
          <OutSideLink
            class="font-semibold"
            href="https://github.com/sonofmagic"
          >
            sonofmagic
          </OutSideLink>
          <span class="text-fg-default">
            publish <span class="inline-block break-all">an article</span>
            <span
              v-if="publishedAgo"
              class="ml-1 inline-block whitespace-nowrap text-xs text-fg-muted"
              :title="item.date"
            >
              {{ publishedAgo }}
            </span>
          </span>
        </div>
      </div>
      <div class="card-body">
        <div class="flex flex-col p-4">
          <NuxtLink class="card-main-title link" :to="item.path">
            {{ item.title }}
          </NuxtLink>

          <div v-if="item.description" class="mb-2.5 mt-1 break-all text-fg-muted">
            {{ item.description }}
          </div>
          <div class="bottom-row">
            <Tags :tags="item.tags" />
            <div class="right-part">
              <span v-if="item.readingMinutes" class="inline-block">阅读时间 {{ item.readingMinutes }} 分钟</span>
              <span v-if="item.readingWords" class="inline-block">共 {{ item.readingWords }} 个字</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ice-card {
  @apply flex border-b border-solid border-border-muted py-4;
  .card-body {
    @apply mt-2 rounded-md border border-solid border-border-default bg-canvas-default;
    .card-main-title {
      @apply block text-base font-semibold text-fg-default;
    }
    .bottom-row {
      @apply flex items-baseline justify-between;
      .right-part {
        @apply flex min-w-[90px] flex-col items-end space-y-1 text-xs text-fg-muted sm:flex-row sm:items-baseline sm:space-x-4 sm:space-y-0;
      }
    }
  }
}
</style>
