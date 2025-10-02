<script setup lang="ts">
type ThemeChoice = 'light' | 'soft-dark'

const themeOrder: ThemeChoice[] = ['soft-dark', 'light']

const colorMode = useColorMode<ThemeChoice>({
  preference: 'soft-dark',
  fallback: 'soft-dark',
  storageKey: 'icebreakers-theme',
  emitAuto: false,
  modes: {
    'soft-dark': 'soft-dark',
    'light': 'light',
  },
})

const themeMeta = computed(() => {
  const metaMap: Record<ThemeChoice, { label: string; icon: string; description: string }> = {
    light: {
      label: '亮色',
      icon: 'line-md:sunny-filled-loop-to-moon-alt-transition',
      description: '明快通透的阅读体验',
    },
    'soft-dark': {
      label: '柔和暗色',
      icon: 'line-md:moon-filled-to-sunny-filled-loop-transition',
      description: '沉稳克制的仪表盘风格',
    },
  }

  const current = themeOrder.includes(colorMode.value) ? colorMode.value : 'soft-dark'
  return metaMap[current]
})

const nextTheme = computed<ThemeChoice>(() => {
  const currentIndex = themeOrder.indexOf(colorMode.value)
  if (currentIndex === -1) {
    return 'soft-dark'
  }
  return themeOrder[(currentIndex + 1) % themeOrder.length]
})

watchEffect(() => {
  if (!themeOrder.includes(colorMode.value)) {
    colorMode.preference = 'soft-dark'
  }
})

function toggleTheme() {
  colorMode.preference = nextTheme.value
}
</script>

<template>
  <button
    type="button"
    class="group flex items-center gap-2 rounded-md border border-border-muted bg-canvas-default px-3 py-2 text-sm font-medium text-fg-default shadow-card shadow-card-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gh-accent-emphasis)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--gh-canvas-default)] hover:border-border-default"
    :aria-label="`切换到 ${nextTheme === 'light' ? '亮色' : '柔和暗色'} 主题`"
    :title="themeMeta.description"
    @click="toggleTheme"
  >
    <Icon :name="themeMeta.icon" class="h-4 w-4 text-accent-emphasis transition-transform duration-200 group-hover:-rotate-6" />
    <span>{{ themeMeta.label }}</span>
  </button>
</template>
