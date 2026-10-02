<script setup lang="ts">
import type { ReadingPreferences } from '@/utils/reading'

const props = defineProps<{ preferences: ReadingPreferences }>()
const emit = defineEmits<{ change: [value: ReadingPreferences] }>()
const open = defineModel<boolean>({ default: false })
const sizes = [{ value: 16, label: '紧凑' }, { value: 18, label: '标准' }, { value: 20, label: '大字' }] as const
</script>

<template>
  <ReaderDialog v-model="open" title="阅读设置">
    <fieldset class="reader-font-sizes">
      <legend>正文字号</legend>
      <div>
        <button v-for="size in sizes" :key="size.value" type="button" :aria-pressed="preferences.fontSize === size.value" @click="emit('change', { ...props.preferences, fontSize: size.value })">
          <span :style="{ fontSize: `${size.value / 16}rem` }">字</span>
          {{ size.label }}
        </button>
      </div>
    </fieldset>
    <label class="reader-focus-option">
      <span><strong>专注阅读</strong><small>收起导航和侧栏，只留下文章。</small></span>
      <input type="checkbox" :checked="preferences.focus" @change="emit('change', { ...props.preferences, focus: ($event.target as HTMLInputElement).checked })">
    </label>
    <p class="reader-settings-note">
      设置会保存在当前浏览器。
    </p>
  </ReaderDialog>
</template>
