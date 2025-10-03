import { defineNuxtConfig } from 'nuxt/config'

const SITE_URL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://blog.icebreaker.top'
const DEFAULT_OG_IMAGE = import.meta.env.NUXT_PUBLIC_SITE_OG_IMAGE || '/icon.png'

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
    '@nuxtjs/seo',
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
  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      siteName: 'icebreaker / notes',
      siteTagline: '写字、做实验、保持好奇',
      defaultDescription: 'icebreaker 的实验笔记、文章与项目记录。',
      defaultOgImage: DEFAULT_OG_IMAGE,
    },
  },
  app: {
    head: {
      title: 'icebreaker / notes',
      titleTemplate: (titleChunk?: string) => {
        const siteName = 'icebreaker / notes'
        if (!titleChunk || titleChunk === siteName) {
          return siteName
        }
        return `${titleChunk} · ${siteName}`
      },
      htmlAttrs: {
        lang: 'zh-Hans',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#1f6feb' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
      ],
    },
  },
  seo: {

  },
  site: {

  },
  // nitro: {
  //   preset: 'cloudflare-pages',
  // },
})
