<script setup lang="ts">
import type { TocLink } from '@/utils/contentBody'

defineProps<{ links: TocLink[], activeId: string | null }>()
const emit = defineEmits<{ move: [id: string] }>()
const tocUi = {
  list: 'reader-toc-list',
  listWithChildren: 'reader-toc-list reader-toc-list--nested',
  item: 'reader-toc-item',
  itemWithChildren: 'reader-toc-item',
  link: 'reader-toc-link',
  linkText: 'reader-toc-text',
  activeLink: 'reader-toc-link--active',
}
</script>

<template>
  <nav aria-label="文章目录">
    <ArticleTocList :links="links" :active-id="activeId" :toc-ui="tocUi" @move="emit('move', $event)" />
  </nav>
</template>
