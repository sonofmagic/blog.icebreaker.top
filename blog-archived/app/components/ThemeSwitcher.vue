<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const colorMode = useColorMode()

const modes = [
  { key: 'light', label: '亮色', description: 'GitHub Light Default', icon: 'i-lucide-sun' },
  { key: 'dark', label: '柔和暗色', description: 'GitHub Dark Soft', icon: 'i-lucide-moon-star' },
] as const

type ModeKey = typeof modes[number]['key']

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const activeKey = computed<ModeKey>(() => {
  const key = colorMode.value as ModeKey | undefined
  if (key && modes.some(mode => mode.key === key)) {
    return key
  }
  const preference = colorMode.preference as ModeKey | undefined
  if (preference && modes.some(mode => mode.key === preference)) {
    return preference
  }
  return 'dark'
})

function setMode(key: ModeKey) {
  colorMode.preference = key
  colorMode.value = key
}

const isDark = computed(() => activeKey.value === 'dark')

const toggleIcon = computed(() => (isDark.value ? 'i-lucide-sun' : 'i-lucide-moon-star'))

const toggleLabel = computed(() => (isDark.value ? '切换到亮色主题' : '切换到暗色主题'))

function toggleMode() {
  setMode(isDark.value ? 'light' : 'dark')
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      v-if="isMounted"
      :icon="toggleIcon"
      variant="ghost"
      color="neutral"
      size="sm"
      class="size-10 rounded-full !px-0 !py-0 flex items-center justify-center text-lg"
      :aria-label="toggleLabel"
      :aria-pressed="isDark"
      :title="`当前为${isDark ? '暗色' : '亮色'}主题 · ${toggleLabel}`"
      @click="toggleMode"
    />
    <UButton
      v-else
      icon="i-lucide-cloud-moon"
      variant="ghost"
      color="neutral"
      size="sm"
      class="size-10 rounded-full !px-0 !py-0 flex items-center justify-center text-lg"
      aria-label="在客户端渲染后启用主题切换"
      title="主题切换"
    />
  </div>
</template>
