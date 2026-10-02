<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps<{ title: string }>()
const open = defineModel<boolean>({ default: false })
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
let previousOverflow: string | undefined
let trigger: HTMLElement | null = null

function unlock() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow
    previousOverflow = undefined
  }
}

watch(open, async (value) => {
  await nextTick()
  if (value && !dialog.value?.open) {
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.value?.showModal()
  }
  else if (!value) {
    dialog.value?.close()
    unlock()
    if (trigger && trigger.getClientRects().length === 0) {
      document.querySelector<HTMLElement>('.reader-dock button')?.focus({ preventScroll: true })
    }
  }
})

function close() {
  open.value = false
  unlock()
}

onBeforeUnmount(() => {
  dialog.value?.close()
  unlock()
})
</script>

<template>
  <dialog ref="dialog" class="reader-dialog" :aria-labelledby="titleId" @cancel="close" @close="close" @click="($event.target === dialog) && close()">
    <div class="reader-dialog__surface">
      <header class="reader-dialog__heading">
        <h2 :id="titleId">
          {{ props.title }}
        </h2>
        <button type="button" class="reader-button" :aria-label="`关闭${props.title}`" autofocus @click="close">
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
