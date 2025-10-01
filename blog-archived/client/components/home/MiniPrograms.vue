<script>
// import 股加加管理端 from '@/assets/img/mini/股加加管理端.jpg'
// import 股加加员工端 from '@/assets/img/mini/股加加员工端.jpg'
// import 股权健康体检 from '@/assets/img/mini/股权健康体检.jpg'
// import 股权激励设计助手 from '@/assets/img/mini/股权激励设计助手.jpg'
import Icebreaker from '@/assets/img/mini/icebreaker.jpg'
// import 股加融资计算器 from '@/assets/img/mini/股加融资计算器.jpg'
import ProgramerCard from '@/assets/img/mini/programer-card.jpg'
import Tailwindcss from '@/assets/img/mini/tailwindcss.jpg'

export default {
  name: 'MiniProgramsBar',
  data() {
    return {
      // companyQrcode: [
      //   {
      //     alt: '股加加管理端',
      //     src: 股加加管理端,
      //   },
      //   {
      //     alt: '股加加员工端',
      //     src: 股加加员工端,
      //   },
      //   {
      //     alt: '股权健康体检',
      //     src: 股权健康体检,
      //   },
      //   {
      //     alt: '股权激励设计助手',
      //     src: 股权激励设计助手,
      //   },
      //   {
      //     alt: '股加融资计算器',
      //     src: 股加融资计算器,
      //   },
      // ],
      selfQrcode: [
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
      ],
    }
  },
}
</script>

<template>
  <div class="flex flex-col space-y-4">
    <div>
      <!-- <div class="text-sm">自己写着玩的：</div> -->
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

    <!-- <hr />
    <div>
      <div class="text-sm">给公司写的(一部分)：</div>
      <div
        v-for="item in companyQrcode"
        :key="item.alt"
        class="text-center w-40 text-sm my-2"
      >
        <img class="w-40" :src="item.src" :alt="item.alt" />
        <div class="mt-2">{{ item.alt }}</div>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.clip-miniprogram-qrcode {
  clip-path: ellipse(80px 80px at center);
}

@keyframes SidebarCreate_rainbowSlide {
  to {
    transform: translateX(-50%);
  }
}

.border-image {
  @apply relative;
}

.border-image:hover::before,
.border-image:focus::before {
  animation: SidebarCreate_rainbowSlide 0.75s linear infinite;
}

.border-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: linear-gradient(115deg, #4fcf70, #fad648, #a767e5, #12bcfe, #44ce7b);
  background-size: 50% 100%;
}
</style>
