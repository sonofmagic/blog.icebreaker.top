<script setup lang="ts">
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const route = useRoute()
const { preferences } = useReadingPreferences()
const isReadingFocused = computed(() => route.path.startsWith('/articles/') && preferences.value.focus)
const currentYear = new Date().getFullYear()

const navLinks = [
  { label: '文章归档', to: '/#archive', icon: 'i-lucide-book-open', activePatterns: ['/', '/articles'] },
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
  <div class="app-shell antialiased" :class="{ 'app-shell--reading-focused': isReadingFocused }">
    <a href="#main-content" class="skip-link">跳到正文</a>
    <header class="app-header">
      <NuxtLink to="/" class="site-brand" aria-label="回到 icebreaker / notes 文章归档">
        <span class="brand-symbol" aria-hidden="true">↗</span>
        <span>ICEBREAKER<span class="brand-suffix"> / NOTES</span></span>
      </NuxtLink>
      <nav class="site-nav" aria-label="主要导航">
        <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" :aria-current="isActiveLink(link) ? 'page' : undefined">
          {{ link.label }} <span aria-hidden="true">↙</span>
        </NuxtLink>
        <a v-for="link in profileLinks" :key="link.label" :href="link.href" target="_blank" rel="noopener noreferrer" :aria-label="link.ariaLabel" class="profile-link">
          {{ link.label }} <span aria-hidden="true">↗</span>
        </a>
        <ThemeSwitcher />
      </nav>
    </header>
    <main id="main-content" tabindex="-1" class="app-main" :class="{ 'app-main--reading': route.path.startsWith('/articles/') }">
      <slot />
    </main>
    <footer class="app-footer">
      <div class="footer-heading">
        STAY CURIOUS<span aria-hidden="true">↗</span>
      </div>
      <div class="footer-bottom">
        <span>© {{ currentYear }} ICEBREAKER / NOTES</span>
        <span>写字、做实验、保持好奇。</span>
        <a href="https://github.com/sonofmagic" target="_blank" rel="noopener noreferrer">FIND ME ON GITHUB ↗</a>
      </div>
    </footer>
  </div>
</template>
