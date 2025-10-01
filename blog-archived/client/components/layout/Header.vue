<script setup lang="ts">
import Logo from '@/assets/img/avatar.jpg'
import DarkModeToggle from './DarkModeToggle.vue'

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
  <header class="site-header">
    <div class="mr-4 flex items-center">
      <NuxtLink class="shrink-0" to="/">
        <img class="size-8 rounded-full" :src="Logo" alt="icebreaker" loading="lazy">
      </NuxtLink>
    </div>
    <div class="header-middle-area hidden grow text-left sm:flex">
      <nav class="nav ml-4 hidden lg:flex lg:items-center">
        <NuxtLink
          v-for="inlink in inSideLinks"
          :key="inlink.key"
          class="link"
          :to="inlink.to"
        >
          {{ inlink.title }}
        </NuxtLink>
        <a
          v-for="item in outSideLinks"
          :key="item.title"
          target="_blank"
          class="link"
          rel="nofollow"
          :href="item.href"
        >
          <span>{{ item.title }}</span>
          <span class="iconify line-md--external-link" />
        </a>
      </nav>
    </div>

    <ClientOnly>
      <div class="tail flex grow justify-end space-x-4 sm:grow-0">
        <DarkModeToggle />
        <OutSideLink
          class="text-xl"
          raw
          href="https://github.com/sonofmagic/icebreaker.top"
        >
          <FontAwesomeIcon :icon="['fab', 'github']" />
        </OutSideLink>
      </div>
    </ClientOnly>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  height: 64px;
  @apply sticky top-0 z-50 flex items-center bg-header-bg px-4 py-4 text-sm text-header-text/70 md:px-6 lg:px-8;
  border-bottom: 1px solid theme('colors.border-muted');
  @apply dark:border-transparent;

  .header-middle-area {
    .nav {
      .link {
        @apply mr-4 cursor-pointer whitespace-nowrap font-semibold text-header-text;

        &:hover,
        &:focus {
          @apply text-header-text/70;
        }
      }
    }
  }

  .tail {
    @apply text-header-text;

    .nav-btn {
      @apply cursor-pointer whitespace-nowrap px-2 py-1 text-base leading-6 text-white outline-none transition-opacity duration-300;

      &:hover {
        @apply opacity-75;
      }

      &.round-border {
        @apply overflow-auto rounded-md border border-solid border-gray-200;
      }
    }
  }
}
</style>
