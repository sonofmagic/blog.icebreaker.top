<script>
import b0 from '@/assets/img/mini/b0.jpg'
import b1 from '@/assets/img/mini/b1.jpg'
import b2 from '@/assets/img/mini/b2.jpg'
import b3 from '@/assets/img/mini/b3.jpg'
import b4 from '@/assets/img/mini/b4.jpg'
import icebreaker from '@/assets/img/mini/icebreaker.jpg'
import icestack from '@/assets/img/mini/icestack.jpg'
import programerCard from '@/assets/img/mini/programer-card.jpg'
import tailwindcss from '@/assets/img/mini/tailwindcss.jpg'

const alts = [
  '股加融资计算器',
  '股权激励设计助手',
  '股权健康体检',
  '股加加管理端',
  '股加加员工端',
  '移动端博客',
  '程序员名片',
  'Tailwindcss',
  'IceStack',
]
export default {
  data() {
    return {
      imgs: [
        b2,
        b3,
        b4,
        b0,
        b1,
        icebreaker,
        programerCard,
        tailwindcss,
        icestack,
      ].map((x, idx) => {
        return {
          alt: alts[idx],
          url: x,
        }
      }),
    }
  },
}
</script>

<template>
  <div class="container mx-auto py-4">
    <div class="grid grid-cols-3 place-items-center gap-2">
      <div v-for="img in imgs" :key="img.url">
        <img class="size-56" :src="img.url" :alt="img.alt">
        <div class="mt-1.5 text-center">
          {{ img.alt }}
        </div>
      </div>
    </div>
  </div>
</template>
