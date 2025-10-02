<script setup lang="ts">
const props = withDefaults(defineProps<{
  raw?: boolean
  href?: string
  target?: string
  rel?: string
}>(), {
  raw: false,
  href: '',
  target: '_blank',
  rel: 'nofollow',
})
</script>

<template>
  <a :target="props.target" :class="props.raw ? '' : 'link'" :rel="props.rel" :href="props.href">
    <slot />
  </a>
</template>
