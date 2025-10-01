<script setup lang="ts">
import Icebreaker from '@/assets/img/mini/icebreaker.jpg'
import ProgramerCard from '@/assets/img/mini/programer-card.jpg'
import Tailwindcss from '@/assets/img/mini/tailwindcss.jpg'

interface MiniProgramEntry {
  desc: string
  alt: string
  src: string
}

const selfQrcode: MiniProgramEntry[] = [
  {
    desc: '本博客站的小程序版本',
    alt: '破冰客',
    src: Icebreaker,
  },
  {
    desc: '一个用于程序员自我展示和相互交流的小程序',
    alt: '程序员名片',
    src: ProgramerCard,
  },
  {
    desc: 'tailwindcss参考小程序',
    alt: 'tailwind',
    src: Tailwindcss,
  },
]
</script>

<template>
  <div class="flex flex-col space-y-4">
    <div>
      <div
        v-for="item in selfQrcode"
        :key="item.alt"
        class="my-2 w-40 text-center text-sm"
      >
        <img class="w-40 rounded-md" :src="item.src" :alt="item.alt">
        <div class="mb-1 mt-2">
          {{ item.alt }}
        </div>
        <div class="text-xs text-gray-400">
          {{ item.desc }}
        </div>
      </div>
    </div>
  </div>
</template>
