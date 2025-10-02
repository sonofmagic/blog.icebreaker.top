<script setup lang="ts">
import { useRouter } from '#imports'
import copyText from 'copy-text-to-clipboard'
import MiniPrograms from './MiniPrograms.vue'

const router = useRouter()

const joy = '😂'
const rofl = '🤣'
const smirk = '😏'

function goToMiniPrograms() {
  router.push('/mp')
}
</script>

<template>
  <div class="space-y-3 py-4 text-sm text-fg-default">
    <div class="space-y-2">
      <div class="font-semibold">
        About icebreaker.top
      </div>
      <div class="text-xs">
        <div>
          Hosted on
          <OutSideLink href="https://www.cloudflare.com/">
            Cloudflare
          </OutSideLink>
        </div>
        <div>
          Deployed by
          <OutSideLink href="https://docs.github.com/en/actions">
            GitHub Actions
          </OutSideLink>
        </div>
      </div>
    </div>
    <div class="space-y-2">
      <div class="font-semibold">
        About
        <span> icebreaker </span>
      </div>
      <div>
        <div class="mt-2 flex">
          <div
            class="group relative flex cursor-pointer items-center rounded-md border border-[#cccccc] py-2 pl-3 pr-5 text-white/80 transition hover:border-[#00C642] hover:bg-[rgb(219,255,219)] hover:text-black/80"
            @click="copyText('npx sonofmagic@latest')"
          >
            <span>
              <FontAwesomeIcon :icon="['fas', 'chevron-right']" />
            </span>

            <pre class="ml-2">npx sonofmagic@latest</pre>
            <span class="absolute right-1 opacity-0 transition-opacity group-hover:opacity-100">
              <FontAwesomeIcon :icon="['far', 'copy']" />
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y-2">
      <div class="font-semibold">
        Skills
      </div>
      <div>
        <ul class="list-inside list-decimal">
          <li>快速成型{{ smirk }}</li>
          <li>各大搜索引擎专长{{ joy }}</li>
          <li>技术文档,源码,发帖提问 {{ joy }}</li>
          <li>脸皮厚{{ rofl }}</li>
        </ul>
      </div>
    </div>
    <div class="space-y-2">
      <div class="flex font-semibold">
        <div
          class="cursor-pointer hover:underline"
          @click="goToMiniPrograms"
        >
          My Mini Programs (Click Here)
        </div>
      </div>
      <div>
        <MiniPrograms />
      </div>
    </div>
  </div>
</template>
