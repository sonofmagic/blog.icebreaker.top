<script setup lang="ts">
import { computed } from 'vue'
import { useArticleLinks } from '@/composables/useArticleLinks'

const props = withDefaults(defineProps<{ hidden?: boolean }>(), {
  hidden: true,
})

const { data } = await useArticleLinks()
const links = computed(() => data.value ?? [])
</script>

<template>
  <div :class="props.hidden ? 'hidden' : ''">
    <slot :data="links">
      <div class="flex flex-col">
        <NuxtLink v-for="item in links" :key="item.id" :to="item.path">
          {{ item.title }}
        </NuxtLink>
      </div>
    </slot>
  </div>
</template>
