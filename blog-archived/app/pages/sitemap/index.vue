<script setup lang="ts">
import Sitemap from '@/components/sitemap/index.vue'

const tagTypes = ['primary', 'success', 'danger', 'warning']

function getTagType(idx = 0) {
  return tagTypes[idx % tagTypes.length] || 'default'
}
</script>

<template>
  <div class="container mx-auto">
    <Sitemap :hidden="false">
      <template #default="{ data }">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="item in data" :key="item.id" class="rounded-md border border-border-default bg-canvas-default p-4 shadow-sm">
            <NuxtLink :to="item.path" class="text-lg font-semibold text-accent-fg hover:underline">
              {{ item.title }}
            </NuxtLink>
            <p v-if="item.description" class="mt-2 text-sm text-fg-muted">
              {{ item.description }}
            </p>
            <div v-if="Array.isArray(item.tags) && item.tags.length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="(tag, idx) in item.tags"
                :key="tag"
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                :class="[
                  getTagType(idx) === 'primary' && 'border-accent-emphasis text-accent-emphasis',
                  getTagType(idx) === 'success' && 'border-emerald-500 text-emerald-500',
                  getTagType(idx) === 'danger' && 'border-red-500 text-red-500',
                  getTagType(idx) === 'warning' && 'border-amber-500 text-amber-500',
                  getTagType(idx) === 'default' && 'border-border-default text-fg-muted',
                ]"
              >
                {{ tag }}
              </span>
            </div>
          </article>
        </div>
      </template>
    </Sitemap>
  </div>
</template>
