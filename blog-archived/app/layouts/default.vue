<script setup lang="ts">
const currentYear = new Date().getFullYear()

const profileLinks = [
  { label: 'GitHub', href: 'https://github.com/innno', icon: 'i-lucide-github' },
  { label: 'Twitter', href: 'https://twitter.com/', icon: 'i-lucide-twitter' },
]
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-[--gh-canvas-subtle] text-[--gh-fg-default]">
      <header class="border-b border-[--gh-border-muted] bg-[--gh-canvas-default]">
        <UContainer class="flex items-center justify-between gap-4 py-4">
          <div class="flex items-center gap-6">
            <ULink to="/" class="flex items-center gap-2 text-[--gh-fg-default] hover:text-[--gh-accent-emphasis]">
              <UIcon name="i-lucide-octagon" class="size-6 text-[--gh-accent-emphasis]" />
              <span class="text-lg font-semibold">icebreaker / notes</span>
            </ULink>
            <nav class="hidden items-center gap-2 md:flex">
              <UButton to="/" variant="ghost" size="lg" icon="i-lucide-home">Overview</UButton>
              <UButton to="/articles" variant="ghost" size="lg" icon="i-lucide-book-open">Articles</UButton>
            </nav>
          </div>

          <div class="flex items-center gap-3">
            <UToggleColorMode size="lg" appearance="underline" />
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
              >
                {{ link.label }}
              </UButton>
            </div>
          </div>
        </UContainer>
      </header>

      <UContainer as="main" class="py-10">
        <slot />
      </UContainer>

      <footer class="border-t border-[--gh-border-muted] bg-[--gh-canvas-default]">
        <UContainer class="flex flex-col gap-2 py-6 text-xs text-[--gh-fg-muted] md:flex-row md:items-center md:justify-between">
          <span>© {{ currentYear }} icebreaker</span>
          <span>Inspired by GitHub’s default light & soft dark looks.</span>
        </UContainer>
      </footer>
    </div>
  </UApp>
</template>
