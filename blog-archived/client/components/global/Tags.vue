<script>
export default {
  name: 'ArticleTags',
  props: {
    tags: {
      type: [Array],
      default: () => [],
    },
  },
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="tag in tags"
      :key="tag"
      class="inline-block cursor-pointer rounded-3xl border border-transparent bg-accent-subtle/20 px-2 text-xs text-accent-fg hover:bg-accent-emphasis hover:text-fg-on-emphasis"
    >
      {{ tag }}
    </div>
  </div>
</template>
