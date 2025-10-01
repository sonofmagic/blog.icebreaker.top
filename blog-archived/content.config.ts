import { defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  highlight: {
    theme: {
      default: 'github-dark',
      dark: 'github-dark',
    },
    preload: ['ts', 'json'],
  },
  markdown: {
    anchorLinks: {
      depth: 3,
    },
    toc: {
      depth: 3,
    },
  },
  navigation: {
    fields: ['title', 'description', 'date', 'tags'],
  },
})
