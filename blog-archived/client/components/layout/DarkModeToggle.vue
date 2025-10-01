<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useToggleTheme } from 'theme-transition'
import { useTheme } from '@/composables/useTheme'

const { isDark, setTheme } = useTheme()

const icon = computed(() => (isDark.value ? ['fas', 'sun'] : ['fas', 'moon']))

const toggleHandler = ref<((event?: MouseEvent) => void) | null>(null)

onMounted(() => {
  const { toggleTheme } = useToggleTheme({
    isCurrentDark: () => isDark.value,
    toggle: () => {
      setTheme(isDark.value ? 'light' : 'dark')
    },
    viewTransition: {
      after: async () => {
        await nextTick()
      },
    },
  })
  toggleHandler.value = toggleTheme
})

function toggleTheme(event?: MouseEvent) {
  toggleHandler.value?.(event)
}
</script>

<template>
  <div class="flex items-center text-xl">
    <FontAwesomeIcon class="cursor-pointer" :icon="icon" @click="toggleTheme" />
  </div>
</template>
