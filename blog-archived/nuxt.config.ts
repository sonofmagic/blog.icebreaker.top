import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { defineNuxtConfig } from 'nuxt/config'
import readingTime from 'reading-time'

loadDotenv()

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const isRelease = process.env.SLS_ENV === 'release'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.icebreaker.top'

function readStatistic(filename: string) {
  const filePath = path.resolve(__dirname, 'statistics', filename)
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8')
  }
  return ''
}

const analyticsScripts = isProd && isRelease
  ? [
      { key: 'hm', children: readStatistic('baidu.js') },
      { key: 'bp', children: readStatistic('baidu-auto-push.js') },
    ].filter(script => Boolean(script.children))
  : []

export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  future: {
    compatibilityVersion: 4,
  },
  srcDir: 'client',
  telemetry: false,
  devServer: {
    port: 9000,
  },
  app: {
    head: {
      title: '我的技术展示_icebreaker_某某打字员_擅长批量生产邮件_文档和代码',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge, chrome=1' },
        { name: 'description', content: '' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
      script: analyticsScripts,
      noscript: [
        { children: '此页面需要javascript支持,请在浏览器中启用javascript' },
      ],
    },
  },
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css',
    '@/assets/scss/global.scss',
  ],
  components: [
    { path: '@/components', pathPrefix: false },
    { path: '@/components/global', global: true, pathPrefix: false },
  ],
  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
  ],
  runtimeConfig: {
    public: {
      siteUrl,
      release: isRelease,
    },
  },
  sitemap: {
    siteUrl,
    cacheMaxAge: 60 * 60 * 2,
    defaults: {
      changefreq: 'daily',
      priority: 1,
    },
  },
  tailwindcss: {
    cssPath: '~/assets/scss/tailwind.scss',
    configPath: '../tailwind.config.js',
    exposeConfig: false,
  },
  content: {
    sources: {
      content: {
        driver: 'fs',
        base: path.resolve(__dirname, 'content'),
      },
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/rss.xml', '/feed.json'],
    },
  },
  hooks: {
    'content:file:afterParse': (document) => {
      if (document.extension === '.md') {
        const source = typeof document.text === 'string' ? document.text : ''
        const { minutes, words } = readingTime(source)
        document.readingMinutes = Math.round(minutes)
        document.readingWords = words
      }
    },
  },
  imports: {
    dirs: ['composables', 'stores'],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/variables.scss" as *;',
        },
      },
    },
  },
})
