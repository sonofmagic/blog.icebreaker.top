<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div>
    <div class="h-[35vh]" />
    <div class="relative pb-[15vh] text-white" style="background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%);">
      <div class="container mx-auto flex flex-col items-center">
        <div class="mt-10 text-6xl font-bold">
          {{ error.statusCode || 404 }}
        </div>
        <div class="mt-4 text-lg text-white/80">
          Nothing ahead
        </div>
        <NuxtLink class="mt-6 rounded-md border border-white/40 px-6 py-2 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white/10" to="/">
          GO BACK
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
