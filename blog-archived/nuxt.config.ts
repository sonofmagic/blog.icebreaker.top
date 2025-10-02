import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-10-02',
  future: {
    compatibilityVersion: 4,
  },
  telemetry: false,
  devServer: {
    port: 9000,
  },
  css: ['@/assets/css/tailwind.css'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@nuxt/content',
  ],
  colorMode: {
    preference: 'soft-dark',
    fallback: 'soft-dark',
    dataValue: 'theme',
    classSuffix: '',
    classPrefix: '',
    storageKey: 'icebreakers-theme',
    modes: {
      'soft-dark': 'soft-dark',
      'light': 'light',
    },
  },
  vite: {
    css: {
      devSourcemap: false,
    },
  },
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      'autoprefixer': {},
    },
  },
  content: {
    highlight: {
      preload: ['ts', 'js', 'json', 'bash', 'yaml', 'vue', 'md', 'html', 'css'],
      highlighter: {
        name: 'shiki',
        options: {
          themes: {
            default: 'github-dark-dimmed',
            dark: 'github-dark-dimmed',
            light: 'github-light',
          },
        },
      },
    },
  },
})
