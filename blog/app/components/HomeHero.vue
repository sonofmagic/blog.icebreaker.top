<script setup lang="ts">
defineProps<{ articleCount: number, firstYear?: string }>()
const paused = ref(false)
const posterSrc = '/images/icefield-poster.webp'
</script>

<template>
  <section class="ice-hero" aria-labelledby="home-title">
    <div class="ice-hero__viewport">
      <img class="ice-hero__poster" :src="posterSrc" alt="冰原上层叠的圆盘形科幻基地，铜橙色灯光照亮寒雾" width="1920" height="1080" fetchpriority="high">
      <ClientOnly><IcefieldScene :paused="paused" /></ClientOnly>
      <div class="ice-hero__shade" />
      <div class="ice-hero__scan" aria-hidden="true" />
    </div>
    <div class="ice-hero__topline">
      <span><span class="hero-dot" /> INDEPENDENT DEVELOPER / OPEN SOURCE</span>
      <span class="ice-hero__edition">PERSONAL FIELD NOTES <span v-if="firstYear">— SINCE {{ firstYear }}</span></span>
    </div>
    <div class="ice-hero__title">
      <p class="ice-hero__eyebrow">
        在数字世界，留下探索的痕迹。
      </p>
      <h1 id="home-title">
        ICEBREAKER<span>/ NOTES<span class="title-star" aria-hidden="true">✳</span></span>
      </h1>
    </div>
    <div class="ice-hero__bottom">
      <div class="ice-hero__intro">
        <span class="hero-barcode" aria-hidden="true" />
        <p>写字、做实验、保持好奇。</p>
        <p class="ice-hero__subline">
          代码之外，还有更远的风景。
        </p>
        <a class="hero-explore" href="#archive">浏览文章 <span aria-hidden="true">↘</span></a>
      </div>
      <div class="hero-manifest">
        <span class="hero-manifest__label">[ THE EXPLORER'S LOG ]</span>
        <p>BUILD SOMETHING.<br>BREAK SOMETHING.<br>LEARN SOMETHING.</p>
        <div><span>{{ articleCount }} ENTRIES</span><span>ALWAYS CURIOUS ↗</span></div>
      </div>
    </div>
    <div class="ice-hero__baseline">
      <span>FRONTEND · OPEN SOURCE · LIFE</span>
      <button type="button" :aria-pressed="paused" class="scene-toggle" @click="paused = !paused">
        {{ paused ? '[ 恢复场景动态 ]' : '[ 暂停场景动态 ]' }}
      </button>
      <a href="#archive" aria-label="向下浏览文章">SCROLL TO EXPLORE ↓</a>
    </div>
  </section>
</template>

<style scoped>
.ice-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100svh - 116px);
  min-height: 700px;
  max-height: 1060px;
  padding: 32px clamp(24px, 4vw, 64px) 20px;
  margin: 16px;
  color: #f3edd8;
  isolation: isolate;
}

.ice-hero__viewport {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: #34484c;
  clip-path: polygon(
    28px 0,
    calc(100% - 28px) 0,
    100% 28px,
    100% calc(100% - 28px),
    calc(100% - 28px) 100%,
    28px 100%,
    0 calc(100% - 28px),
    0 28px
  );
}

.ice-hero__poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ice-hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(9 15 17 / 68%), transparent 70%),
    linear-gradient(0deg, rgb(9 15 17 / 90%), transparent 43%, rgb(9 15 17 / 12%));
}

.ice-hero__scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, #0c171b 4px);
  opacity: 0.15;
}

.ice-hero__topline,
.ice-hero__baseline {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  font-family: var(--gh-font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

.hero-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 0.55rem;
  background: #fd8a46;
}

.ice-hero__title {
  padding-top: 70px;
  margin-top: auto;
}

.ice-hero__eyebrow {
  margin-bottom: 24px;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
}

.ice-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(5rem, 10.6vw, 11.5rem);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -0.025em;
}

.ice-hero h1 > span {
  display: block;
}

.title-star {
  display: inline-block;
  margin-left: 0.35em;
  font-family: sans-serif;
  font-size: 0.55em;
  vertical-align: 15%;
  color: #fd8a46;
}

.ice-hero__bottom {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 44px;
  padding-bottom: 32px;
  margin-top: auto;
}

.hero-barcode {
  display: block;
  width: 46px;
  height: 11px;
  margin-bottom: 16px;
  background: repeating-linear-gradient(
    90deg,
    #f3edd8 0 2px,
    transparent 2px 4px,
    #f3edd8 4px 5px,
    transparent 5px 9px
  );
}

.ice-hero__intro p {
  font-size: 0.9rem;
  line-height: 1.9;
}

.ice-hero__intro .ice-hero__subline {
  font-size: 0.75rem;
  color: #c4cecb;
}

.hero-explore {
  display: inline-flex;
  gap: 2.5rem;
  align-items: center;
  min-height: 44px;
  margin-top: 1rem;
  font-size: 0.8rem;
  border-bottom: 1px solid #f3edd880;
}

.hero-explore span {
  font-size: 1.5rem;
  color: #fd8a46;
}

.hero-explore:hover {
  color: #fd8a46;
}

.hero-manifest {
  position: relative;
  min-width: 270px;
  padding: 24px;
  font-family: var(--gh-font-mono);
  background: #182a2b38;
  border: 1px solid #f3edd850;
  backdrop-filter: blur(10px);
}

.hero-manifest::before,
.hero-manifest::after {
  position: absolute;
  width: 12px;
  height: 12px;
  content: '';
  border-color: #f3edd8;
}

.hero-manifest::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid;
  border-left: 2px solid;
}

.hero-manifest::after {
  right: -1px;
  bottom: -1px;
  border-right: 2px solid;
  border-bottom: 2px solid;
}

.hero-manifest__label {
  font-size: 0.57rem;
  color: #fd8a46;
}

.hero-manifest p {
  margin: 18px 0 24px;
  font-size: 0.8rem;
  line-height: 1.9;
}

.hero-manifest > div {
  display: flex;
  gap: 1.5rem;
  justify-content: space-between;
  font-size: 0.5rem;
  color: #c4cecb;
}

.ice-hero__baseline {
  min-height: 35px;
  font-size: 0.5rem;
  border-top: 1px solid #f3edd82e;
}

.scene-toggle {
  min-height: 36px;
  color: #c4cecb;
}

.scene-toggle:hover {
  color: #fd8a46;
}

@media (min-width: 768px) and (max-height: 800px) {
  .ice-hero {
    min-height: 560px;
    padding-top: 24px;
  }

  .ice-hero__title {
    padding-top: 30px;
  }

  .ice-hero h1 {
    font-size: clamp(5rem, 9vw, 8rem);
  }

  .ice-hero__bottom {
    padding-top: 24px;
    padding-bottom: 20px;
  }

  .hero-manifest {
    padding: 18px;
  }
}

@media (max-width: 1000px) {
  .ice-hero {
    min-height: 560px;
  }

  .ice-hero__edition {
    display: none;
  }

  .hero-manifest {
    min-width: 235px;
    padding: 18px;
  }
}

@media (max-width: 767px) {
  .scene-toggle {
    display: none;
  }

  .ice-hero {
    height: calc(100svh - 88px);
    min-height: 640px;
    max-height: 850px;
    padding: 26px 22px 12px;
    margin: 8px;
  }

  .ice-hero__poster {
    object-position: 65% center;
  }

  .ice-hero__title {
    padding-top: 70px;
  }

  .ice-hero h1 {
    font-size: clamp(3.7rem, 12.4vw, 6rem);
  }

  .ice-hero__eyebrow {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
  }

  .ice-hero__topline {
    font-size: 0.46rem;
  }

  .hero-manifest {
    display: none;
  }

  .ice-hero__bottom {
    padding-top: 70px;
    padding-bottom: 24px;
  }

  .ice-hero__baseline {
    font-size: 0.43rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene-toggle {
    display: none;
  }
}
</style>
