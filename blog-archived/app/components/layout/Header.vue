<script setup lang="ts">
import Logo from '@/assets/img/avatar.jpg'

const outSideLinks = [
  { href: 'https://tw.icebreaker.top/', title: 'Weapp-tailwindcss' },
  { href: 'https://vite.icebreaker.top/', title: 'Weapp-vite' },
  { href: 'https://ui.icebreaker.top/zh-CN', title: 'IceStack' },
  { href: 'https://monorepo.icebreaker.top/', title: 'Monorepo' },
  { href: 'https://eslint.icebreaker.top/', title: 'Eslint' },
  { href: 'https://www.npmjs.com/~icebreaker', title: 'Packages' },
]

const inSideLinks: Array<{ key: string; title: string; to: string }> = []
</script>

<template>
  <header class="sticky top-0 z-50 flex h-16 items-center border-b border-border-muted bg-header-bg px-4 py-4 text-sm text-header-text/70 dark:border-transparent md:px-6 lg:px-8">
    <div class="mr-4 flex items-center">
      <NuxtLink class="shrink-0" to="/">
        <img class="size-8 rounded-full" :src="Logo" alt="icebreaker" loading="lazy">
      </NuxtLink>
    </div>
    <div class="hidden grow text-left sm:flex">
      <nav class="ml-4 hidden lg:flex lg:items-center">
        <NuxtLink
          v-for="inlink in inSideLinks"
          :key="inlink.key"
          class="mr-4 cursor-pointer whitespace-nowrap font-semibold text-header-text transition hover:text-header-text/70 focus:text-header-text/70"
          :to="inlink.to"
        >
          {{ inlink.title }}
        </NuxtLink>
        <a
          v-for="item in outSideLinks"
          :key="item.title"
          target="_blank"
          rel="nofollow"
          class="mr-4 flex cursor-pointer items-center whitespace-nowrap font-semibold text-header-text transition hover:text-header-text/70 focus:text-header-text/70"
          :href="item.href"
        >
          <span>{{ item.title }}</span>
          <span class="iconify line-md--external-link" />
        </a>
      </nav>
    </div>

    <ClientOnly>
      <div class="flex grow justify-end space-x-4 text-header-text sm:grow-0">
        <OutSideLink class="text-xl" raw href="https://github.com/sonofmagic/icebreaker.top">
          <FontAwesomeIcon :icon="['fab', 'github']" />
        </OutSideLink>
      </div>
    </ClientOnly>
  </header>
</template>
