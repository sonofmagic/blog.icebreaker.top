import { computed } from 'vue'
import { LocalStorageKey } from '@/enum/user'

type ThemeMode = 'dark' | 'light'

export function useTheme() {
  const colorMode = useColorMode<ThemeMode>({
    attribute: LocalStorageKey.ThemeMode,
    storageKey: LocalStorageKey.ThemeMode,
    emitAuto: false,
    initialValue: 'dark',
  })

  const mode = computed<ThemeMode>({
    get() {
      return colorMode.value ?? 'dark'
    },
    set(value) {
      colorMode.value = value
    },
  })

  const isDark = computed(() => mode.value === 'dark')
  const isLight = computed(() => mode.value === 'light')

  function setTheme(value: ThemeMode) {
    mode.value = value
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  return {
    mode,
    isDark,
    isLight,
    setTheme,
    toggleTheme,
  }
}
