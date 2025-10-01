<script setup lang="ts">
import { version as packageVersion } from '~~/package.json'

const fullYear = new Date().getFullYear()
const version = packageVersion
</script>

<template>
  <section class="container mx-auto py-2">
    <div
      class="dark:text-accents-600 flex flex-col items-center justify-between px-4 text-xs text-gray-600 sm:flex-row"
    >
      <div class="flex space-x-4">
        <span>© {{ fullYear }} icebreaker</span>
        <a target="_blank" rel="nofollow" href="http://beian.miit.gov.cn">
          苏ICP备19002675号-2
        </a>
        <span class="flex flex-nowrap gap-2">
          <img src="@/assets/img/beian.png" class="h-4 object-fill">
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=32050602011962"
            rel="noreferrer"
            target="_blank"
          >
            苏公网安备32050602011962
          </a>
        </span>
      </div>
      <div>version:{{ version }}</div>
      <div class="flex flex-col items-center md:flex-row">
        <div class="space-x-3">
          <NuxtLink to="/sitemap">
            站点地图
          </NuxtLink>
          <OutSideLink
            class="text-base hover:text-gray-700"
            raw
            href="https://www.icebreaker.top/rss.xml"
          >
            <FontAwesomeIcon :icon="['fas', 'square-rss']" />
          </OutSideLink>
          <OutSideLink
            class="text-base hover:text-gray-700"
            raw
            href="https://github.com/sonofmagic/icebreaker.top"
          >
            <FontAwesomeIcon :icon="['fab', 'github']" />
          </OutSideLink>
        </div>
      </div>
    </div>
  </section>
</template>
