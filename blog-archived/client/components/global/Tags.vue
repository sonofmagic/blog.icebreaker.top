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
  <div class="space-x-2">
    <div v-for="tag in tags" :key="tag" class="ice-tag">
      {{ tag }}
    </div>
  </div>
</template>

<style scoped>
.ice-tag {
  @apply inline-block text-accent-fg bg-accent-subtle/20 px-2 text-xs rounded-3xl border border-solid border-transparent cursor-pointer hover:bg-accent-emphasis hover:text-fg-on-emphasis;
}
</style>
