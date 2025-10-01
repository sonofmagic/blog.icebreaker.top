import { computed } from 'vue'

export function useTheme() {
  const mode = computed(() => 'dark' as const)
  const isDark = computed(() => true)
  const isLight = computed(() => false)

  function setTheme() {}
  function toggleTheme() {}

  return {
    mode,
    isDark,
    isLight,
    setTheme,
    toggleTheme,
  }
}
