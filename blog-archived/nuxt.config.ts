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
    '@nuxt/ui',
    '@nuxt/content',
  ],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    dataValue: 'theme',
    classSuffix: '',
    classPrefix: '',
    storageKey: 'icebreakers-theme',
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

  },
})
