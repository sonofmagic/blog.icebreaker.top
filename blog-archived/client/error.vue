<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div>
    <div class="land" />
    <div class="sea">
      <div class="container mx-auto flex flex-col items-center">
        <div class="island">
          {{ error.statusCode || 404 }}
        </div>
        <div class="end">
          Nothing ahead
        </div>
        <NuxtLink class="back-btn" to="/">
          GO BACK
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.land {
  height: 35vh;
}

.sea {
  position: relative;
  padding-bottom: 15vh;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.65) 100%);
  color: #fff;
}

.island {
  @apply mt-10 text-6xl font-bold;
}

.end {
  @apply mt-4 text-lg text-white/80;
}

.back-btn {
  @apply mt-6 rounded-md border border-white/40 px-6 py-2 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/10;
}
</style>
