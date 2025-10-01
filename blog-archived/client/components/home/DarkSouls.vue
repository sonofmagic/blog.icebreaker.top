<script>
// import { wechat } from '@/assets/img/cloud'
import wechatMyQrcode from '@/assets/img/wechat.jpg'
import copyText from 'copy-text-to-clipboard'
import MiniPrograms from './MiniPrograms'

export default {
  name: 'MySelf',
  components: {
    MiniPrograms,
  },
  data() {
    const refs = {
      joy: '😂', // nameToEmoji.joy,
      rofl: '🤣', // nameToEmoji.rofl,
      smirk: '😏', // nameToEmoji.smirk,
      icebreakerQrcodeUrl: wechatMyQrcode, // wechat.myQrcode2,
    }

    return refs
  },
  methods:{
    copyText
  }
}
</script>

<template>
  <div class="a-dark-soul space-y-3 py-4">
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
        <span
        >
          icebreaker
        </span>
      </div>
      <div>
        <div class="mt-2 flex">
          <div class="npx-command" @click="copyText('npx sonofmagic@latest')">
            <span>
              <FontAwesomeIcon :icon="['fas', 'chevron-right']" />
            </span>

            <pre class="ml-2">npx sonofmagic@latest</pre>
            <span class="copy-icon">
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
          @click="$router.push('/mp')"
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

<style>
[data-color-mode='light'] .a-dark-soul .npx-command {
  @apply text-black/80 !important;
}
</style>

<style scoped>
.a-dark-soul {
  @apply text-sm text-fg-default;
}

.a-dark-soul .npx-command {
  @apply relative flex cursor-pointer items-center rounded-md border border-solid border-[#cccccc] py-2 pl-3 pr-5 text-white/80 hover:border-[#00C642] hover:bg-[rgb(219,255,219)] hover:text-black/80;
}

.a-dark-soul .npx-command .copy-icon {
  @apply absolute right-1 opacity-0 transition-opacity;
}

.a-dark-soul .npx-command:hover .copy-icon {
  @apply opacity-100;
}
</style>
