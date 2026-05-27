<script setup lang="ts">
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const currentYear = new Date().getFullYear()

const navLinks = [
  { label: '文章', to: '/', icon: 'i-lucide-book-open', activePatterns: ['/', '/articles'] },
] as const

const profileLinks = [
  { label: 'GitHub', href: 'https://github.com/sonofmagic', icon: 'i-lucide-github', ariaLabel: '在新窗口打开 GitHub 主页' },
  { label: 'Twitter', href: 'https://x.com/sonofmagic95', icon: 'i-lucide-twitter', ariaLabel: '在新窗口打开 Twitter 主页' },
]

function isActiveLink(link: typeof navLinks[number]) {
  if (link.activePatterns) {
    return link.activePatterns.some((pattern) => {
      if (pattern === '/') {
        return route.path === '/'
      }
      return route.path === pattern || route.path.startsWith(`${pattern}/`)
    })
  }
  return route.path === link.to || route.path.startsWith(`${link.to}/`)
}

if (import.meta.client) {
  watch(
    () => route.path,
    async (_path, previousPath) => {
      if (!previousPath || route.hash) {
        return
      }

      await nextTick()
      requestAnimationFrame(() => {
        document.getElementById('main-content')?.focus({ preventScroll: true })
      })
    },
  )
}
</script>

<template>
  <div class="app-shell text-[--gh-fg-default] antialiased">
    <a href="#main-content" class="skip-link">
      跳到正文
    </a>

    <header
      class="app-header relative z-40 mx-auto mt-4 w-[min(100%,_1100px)] rounded-3xl border border-[--surface-border] bg-[--panel-bg-soft] px-4 py-3 shadow-sm backdrop-blur-md transition-all duration-200 sm:top-6 sm:mt-6 sm:px-6 sm:py-4 md:sticky"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div class="flex items-center justify-between gap-3 md:justify-start md:gap-6">
          <ULink
            to="/"
            class="flex min-h-11 items-center gap-3 text-muted-strong transition hover:text-[--gh-accent-emphasis]"
            aria-label="回到 icebreaker / notes 文章归档"
          >
            <span class="flex size-11 items-center justify-center rounded-2xl bg-[--gh-accent-subtle] text-[--gh-accent-emphasis] shadow-sm">
              <UIcon name="i-lucide-octagon" class="size-5" />
            </span>
            <span class="flex flex-col text-sm leading-tight">
              <span class="font-semibold tracking-tight">icebreaker / notes</span>
              <span class="text-xs text-muted">写字、做实验、保持好奇</span>
            </span>
          </ULink>

          <div class="flex shrink-0 items-center gap-1 md:hidden">
            <ThemeSwitcher />
            <UButton
              v-for="link in profileLinks"
              :key="link.label"
              :href="link.href"
              target="_blank"
              rel="noopener"
              size="sm"
              variant="ghost"
              :icon="link.icon"
              class="size-11 rounded-full !px-0 !py-0 flex items-center justify-center text-lg text-muted hover:text-[--gh-accent-emphasis]"
              :aria-label="link.ariaLabel"
              :title="link.label"
            >
              <span class="sr-only">{{ link.label }}</span>
            </UButton>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <nav class="flex items-center gap-1 rounded-full bg-[--panel-bg-soft] p-1 shadow-sm" aria-label="主要导航">
            <UButton
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              :variant="isActiveLink(link) ? 'solid' : 'ghost'"
              :color="isActiveLink(link) ? 'primary' : 'neutral'"
              :icon="link.icon"
              size="sm"
              class="min-h-11 rounded-full px-4"
              :aria-current="isActiveLink(link) ? 'page' : undefined"
            >
              {{ link.label }}
            </UButton>
          </nav>

          <div class="hidden items-center gap-2 md:flex">
            <ThemeSwitcher />
            <UButton
              v-for="link in profileLinks"
              :key="link.label"
              :href="link.href"
              target="_blank"
              rel="noopener"
              size="sm"
              variant="ghost"
              :icon="link.icon"
              class="size-11 rounded-full !px-0 !py-0 flex items-center justify-center text-lg text-muted hover:text-[--gh-accent-emphasis]"
              :aria-label="link.ariaLabel"
              :title="link.label"
            >
              <span class="sr-only">{{ link.label }}</span>
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <main id="main-content" tabindex="-1" class="app-main mx-auto w-[min(100%,_1100px)] flex-1 py-12">
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
