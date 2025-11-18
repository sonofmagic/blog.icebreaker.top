<script setup lang="ts">
import { computed } from 'vue'

interface TocLink {
  id: string
  text: string
  children?: TocLink[]
  ui?: Record<string, string>
  class?: string
}

defineOptions({ name: 'ArticleTocList' })

const props = withDefaults(defineProps<{
  links?: TocLink[]
  level?: number
  tocUi?: Record<string, string>
}>(), {
  links: () => [],
  level: 0,
})

const listClass = computed(() => props.level > 0
  ? props.tocUi?.listWithChildren || 'mt-2 space-y-1 border-l border-[--surface-border]/60 pl-3'
  : props.tocUi?.list || 'space-y-1 text-sm text-muted leading-relaxed')

const itemClass = computed(() => props.level > 0
  ? props.tocUi?.itemWithChildren || 'pl-2'
  : props.tocUi?.item || 'max-w-full overflow-hidden')

const linkClass = computed(() => props.tocUi?.link || 'block max-w-full truncate rounded-lg px-3 py-1.5 text-left transition-colors duration-150 hover:bg-[--panel-bg-soft] hover:text-[--gh-accent-emphasis]')

const linkTextClass = computed(() => props.tocUi?.linkText || 'break-words text-left')
</script>

<template>
  <ul v-if="links?.length" :class="listClass">
    <li
      v-for="link in links"
      :key="link.id"
      :class="[itemClass, link.children?.length ? props.tocUi?.itemWithChildren : null]"
    >
      <a :href="`#${link.id}`" :class="[linkClass, link.class]">
        <span :class="[linkTextClass, link.ui?.linkText]">
          {{ link.text }}
        </span>
      </a>
      <ArticleTocList
        v-if="link.children?.length"
        :links="link.children"
        :level="level + 1"
        :toc-ui="tocUi"
      />
    </li>
  </ul>
</template>
