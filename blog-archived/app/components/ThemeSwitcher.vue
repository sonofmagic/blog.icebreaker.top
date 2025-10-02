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

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const next = target?.value as ModeKey | undefined
  if (next) {
    setMode(next)
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-if="isMounted" class="hidden items-center gap-2 md:inline-flex">
      <UButton
        v-for="mode in modes"
        :key="mode.key"
        :title="`${mode.label} · ${mode.description}`"
        :aria-label="`切换为${mode.label}主题`"
        :aria-pressed="activeKey === mode.key"
        :variant="activeKey === mode.key ? 'solid' : 'ghost'"
        :color="activeKey === mode.key ? 'primary' : 'neutral'"
        :icon="mode.icon"
        size="sm"
        class="gap-1"
        @click="setMode(mode.key)"
      >
        <span class="hidden text-xs font-medium sm:inline">{{ mode.label }}</span>
      </UButton>
    </div>

    <div v-else>
      <UButton
        icon="i-lucide-cloud-moon"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="在客户端渲染后启用主题切换"
        title="主题切换"
      />
    </div>

    <select
      v-if="isMounted"
      :value="activeKey"
      class="md:hidden rounded-full border border-[--surface-border] bg-transparent px-3 py-1 text-xs text-muted"
      aria-label="选择主题"
      @change="onSelectChange"
    >
      <option
        v-for="mode in modes"
        :key="mode.key"
        :value="mode.key"
      >
        {{ mode.label }}
      </option>
    </select>
  </div>
</template>
