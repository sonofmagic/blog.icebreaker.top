<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

const theme = computed(() => (isDark.value ? 'dark_dimmed' : 'light'))

onMounted(async () => {
  await import('giscus')
})
</script>

<template>
  <div>
    <giscus-widget
      repo="sonofmagic/blog.icebreaker.top"
      repoid="MDEwOlJlcG9zaXRvcnkzMjkxNjA0MzM="
      category="Announcements"
      categoryid="MDE4OkRpc2N1c3Npb25DYXRlZ29yeTMzMDMyNzIx"
      mapping="pathname"
      strict="0"
      reactionsenabled="1"
      emitmetadata="0"
      inputposition="bottom"
      :theme="theme"
      lang="zh-CN"
      crossorigin="anonymous"
      loading="lazy"
    />
  </div>
</template>
