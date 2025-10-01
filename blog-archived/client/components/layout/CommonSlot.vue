<script setup lang="ts">
import AppFooter from '@/components/layout/Footer.vue'
import AppHeader from '@/components/layout/Header.vue'

const props = withDefaults(defineProps<{
  noHeader?: boolean
  noFooter?: boolean
}>(), {
  noHeader: false,
  noFooter: false,
})
</script>

<template>
  <section>
    <AppHeader v-if="!props.noHeader" />

    <slot />

    <AppFooter v-if="!props.noFooter" />
  </section>
</template>
