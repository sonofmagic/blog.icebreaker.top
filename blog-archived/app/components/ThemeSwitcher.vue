<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const colorMode = useColorMode()

const modes = [
  { key: 'light', label: '亮色', description: 'GitHub Light Default', icon: 'i-lucide-sun' },
  { key: 'soft-dark', label: '柔和暗色', description: 'GitHub Dark Soft', icon: 'i-lucide-moon-star' },
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
  return 'soft-dark'
})

function setMode(key: ModeKey) {
  colorMode.preference = key
  colorMode.value = key
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButtonGroup v-if="isMounted" size="sm" class="hidden md:inline-flex">
      <UTooltip v-for="mode in modes" :key="mode.key" :text="`${mode.label} · ${mode.description}`">
        <UButton
          :aria-label="`切换为${mode.label}主题`"
          :aria-pressed="activeKey === mode.key"
          :variant="activeKey === mode.key ? 'solid' : 'ghost'"
          :color="activeKey === mode.key ? 'primary' : 'neutral'"
          :icon="mode.icon"
          class="gap-1"
          @click="setMode(mode.key)"
        >
          <span class="hidden text-xs font-medium sm:inline">{{ mode.label }}</span>
        </UButton>
      </UTooltip>
    </UButtonGroup>

    <UTooltip v-else text="主题切换">
      <UButton icon="i-lucide-cloud-moon" variant="ghost" color="neutral" size="sm" aria-label="在客户端渲染后启用主题切换" />
    </UTooltip>

    <UDropdown
      v-if="isMounted"
      :items="[
        [
          ...modes.map(mode => ({
            label: mode.label,
            description: activeKey === mode.key ? '当前主题' : mode.description,
            icon: mode.icon,
            click: () => setMode(mode.key),
          })),
        ],
      ]"
    >
      <UButton icon="i-lucide-ellipsis" variant="ghost" color="neutral" size="sm" aria-label="展开主题切换菜单" />
    </UDropdown>
  </div>
</template>
