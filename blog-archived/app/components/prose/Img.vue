<script setup lang="ts">
import ImageComponent from '#build/ui-image-component'
import { useRuntimeConfig } from '#imports'
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
  width: { type: [String, Number], required: false },
  height: { type: [String, Number], required: false },
  class: { type: null, required: false },
  ui: { type: Object, required: false },
})

const refinedSrc = computed(() => {
  if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
    const base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL))
    if (base !== '/' && !props.src.startsWith(base)) {
      return joinURL(base, props.src)
    }
  }
  return props.src
})

const baseClass = computed(() => props.ui?.base || 'max-w-full rounded-2xl border border-[--surface-border]/60 bg-[--panel-bg]')
</script>

<template>
  <component
    :is="ImageComponent"
    :src="refinedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    v-bind="$attrs"
    :class="[baseClass, props.class]"
    loading="lazy"
  />
</template>
