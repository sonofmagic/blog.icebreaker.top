<script setup lang="ts">
import ThemeToggleButton from '@/components/theme/ThemeToggleButton.vue'

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-canvas-subtle text-fg-default transition-colors">
    <header class="sticky top-0 z-20 border-b border-border-muted bg-canvas-default/95 backdrop-blur supports-[backdrop-filter]:bg-canvas-default">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 text-lg font-semibold tracking-tight text-fg-default transition-colors hover:text-accent-emphasis"
        >
          <span class="hidden h-9 w-9 items-center justify-center rounded-md border border-border-muted bg-canvas-default text-accent-emphasis shadow-card sm:inline-flex">
            <Icon name="line-md:github" class="h-5 w-5" />
          </span>
          <span>icebreaker · notes</span>
        </NuxtLink>

        <nav class="flex items-center gap-4 text-sm text-fg-muted">
          <NuxtLink to="/" class="flex items-center gap-1 hover:text-accent-emphasis">
            <Icon name="line-md:home" class="h-4 w-4" />
            <span>首页</span>
          </NuxtLink>
          <NuxtLink to="/articles" class="flex items-center gap-1 hover:text-accent-emphasis">
            <Icon name="simple-icons:readme" class="h-4 w-4" />
            <span>所有文章</span>
          </NuxtLink>
          <a href="https://github.com/innno" target="_blank" rel="noopener" class="hidden items-center gap-1 hover:text-accent-emphasis md:flex">
            <Icon name="simple-icons:github" class="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </nav>

        <div class="flex items-center gap-3">
          <p class="hidden text-sm text-fg-muted md:block">
            记录一些想法和日常
          </p>
          <ThemeToggleButton />
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <slot />
    </main>

    <footer class="border-t border-border-muted bg-canvas-default">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© {{ currentYear }} icebreaker</span>
        <span>写一点生活、阅读与技术之外的小事。</span>
      </div>
    </footer>
  </div>
</template>
