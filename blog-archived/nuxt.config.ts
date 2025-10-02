import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'
import readingTime from 'reading-time'

const isProd = process.env.NODE_ENV === 'production'
const isRelease = process.env.SLS_ENV === 'release'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.icebreaker.top'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function readStatistic(filename: string) {
  const filePath = path.resolve(__dirname, 'statistics', filename)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
}

const analyticsScripts = (isProd && isRelease)
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
    '@/assets/css/tailwind.css',
  ],
  components: [
    { path: '@/components', pathPrefix: false },
    { path: '@/components/global', global: true, pathPrefix: false },
  ],
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'giscus-widget',
    },
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
  ],
  alias: {
    '@': path.resolve(__dirname, 'app'),
    '~': path.resolve(__dirname, 'app'),
    '#content/server': path.resolve(__dirname, 'node_modules/@nuxt/content/dist/runtime/server.js'),
  },
  runtimeConfig: {
    public: {
      siteUrl,
      release: isRelease,
    },
  },
  sitemap: {
    site: {
      url: siteUrl,
    },
    cacheMaxAge: 60 * 60 * 2,
    defaults: {
      changefreq: 'daily',
      priority: 1,
    },
  },
  content: {
    highlight: {
      theme: {
        default: 'github-dark',
        dark: 'github-dark',
      },
    },
    markdown: {
      toc: {
        depth: 3,
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
    'content:file:afterParse': ({ collection, file, content }) => {
      if (collection.name !== 'articles') {
        return
      }
      if (typeof file.body !== 'string') {
        return
      }
      const { minutes, words } = readingTime(file.body)
      content.readingMinutes = Math.round(minutes)
      content.readingWords = words
    },
  },
  imports: {
    dirs: ['composables', 'stores'],
  },
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      'autoprefixer': {},
    },
  },
})
