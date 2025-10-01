<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, setTheme } = useTheme()

const darkMode = computed({
  get: () => isDark.value,
  set: (value: boolean) => {
    setTheme(value ? 'dark' : 'light')
  },
})

function toggle() {
  darkMode.value = !darkMode.value
}
</script>

<template>
  <span class="flex items-center">
    <span class="mr-4 text-sm font-semibold">Dark Mode</span>
    <button
      type="button"
      class="switch"
      :aria-pressed="darkMode"
      @click="toggle"
    >
      <span class="switch-handle" :class="{ 'translate-x-5': darkMode }" />
    </button>
  </span>
</template>

<style scoped>
.switch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-emphasis;
}

.switch[aria-pressed='true'] {
  @apply bg-accent-emphasis;
}

.switch-handle {
  @apply inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out;
}
</style>
