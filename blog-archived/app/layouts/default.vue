<script setup lang="ts">
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const currentYear = new Date().getFullYear()

const navLinks = [
  { label: '文章', to: '/', icon: 'i-lucide-book-open' },
] as const

const profileLinks = [
  { label: 'GitHub', href: 'https://github.com/sonofmagic', icon: 'i-lucide-github' },
  { label: 'Twitter', href: 'https://x.com/sonofmagic95', icon: 'i-lucide-twitter' },
]

function isActiveLink(path: string) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-shell text-[--gh-fg-default] antialiased">
    <header
      class="app-header sticky top-3 z-40 mx-auto mt-4 w-[min(100%,_1100px)] rounded-3xl border border-[--surface-border] bg-[--panel-bg-soft] px-4 py-3 shadow-sm backdrop-blur-md transition-all duration-200 sm:top-6 sm:mt-6 sm:px-6 sm:py-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-6">
          <ULink
            to="/"
            class="flex items-center gap-3 text-muted-strong transition hover:text-[--gh-accent-emphasis]"
          >
            <span class="flex size-10 items-center justify-center rounded-2xl bg-[--gh-accent-subtle] text-[--gh-accent-emphasis] shadow-sm">
              <UIcon name="i-lucide-octagon" class="size-5" />
            </span>
            <span class="flex flex-col text-sm leading-tight">
              <span class="font-semibold tracking-tight">icebreaker / notes</span>
              <span class="text-xs text-muted">写字、做实验、保持好奇</span>
            </span>
          </ULink>

          <nav class="flex items-center gap-1 rounded-full bg-[--panel-bg-soft] p-1 shadow-sm">
            <UButton
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              :variant="isActiveLink(link.to) ? 'solid' : 'ghost'"
              :color="isActiveLink(link.to) ? 'primary' : 'neutral'"
              :icon="link.icon"
              size="sm"
              class="rounded-full px-3"
            >
              {{ link.label }}
            </UButton>
          </nav>
        </div>

        <div class="flex flex-nowrap items-center gap-2">
          <ThemeSwitcher />
          <div class="hidden items-center gap-2 md:flex">
            <UButton
              v-for="link in profileLinks"
              :key="link.label"
              :href="link.href"
              target="_blank"
              rel="noopener"
              size="sm"
              variant="ghost"
              :icon="link.icon"
              class="size-10 rounded-full !px-0 !py-0 flex items-center justify-center text-lg text-muted hover:text-[--gh-accent-emphasis]"
              :aria-label="link.label"
              :title="link.label"
            >
              <span class="sr-only">{{ link.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main mx-auto w-[min(100%,_1100px)] flex-1 py-12">
      <UContainer class="max-w-none">
        <slot />
      </UContainer>
    </main>

    <footer class="app-footer mx-auto mb-10 w-[min(100%,_1100px)] rounded-3xl px-6 py-4">
      <div class="flex flex-col items-start gap-3 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <span>© {{ currentYear }} icebreaker · 保持真诚与松弛</span>
        <span class="flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="size-4 text-[--gh-accent-emphasis]" />
          <span>Made with Nuxt · 支持浅色 / 深色主题</span>
        </span>
      </div>
    </footer>
  </div>
</template>
