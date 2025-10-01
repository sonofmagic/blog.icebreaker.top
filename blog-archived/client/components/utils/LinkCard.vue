<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  to?: string | Record<string, unknown>
  title?: string
  desc?: string
  outSide?: boolean
}>(), {
  to: '',
  title: '',
  desc: '',
  outSide: false,
})

const externalHref = computed(() => (typeof props.to === 'string' ? props.to : ''))
</script>

<template>
  <OutSideLink
    v-if="props.outSide"
    class="border-border-default rounded-md border"
    raw
    :href="externalHref"
  >
    <div class="p-4 shadow">
      <div class="text-accent-fg mb-3 text-2xl font-thin hover:underline">
        {{ props.title }}
      </div>
      <div class="text-fg-muted text-sm">
        {{ props.desc }}
      </div>
    </div>
  </OutSideLink>

  <NuxtLink
    v-else
    :to="props.to"
    class="border-border-default rounded-md border"
  >
    <div class="p-4 shadow">
      <div class="text-accent-fg mb-3 text-2xl font-thin hover:underline">
        {{ props.title }}
      </div>
      <div class="text-fg-muted text-sm">
        {{ props.desc }}
      </div>
    </div>
  </NuxtLink>
</template>
