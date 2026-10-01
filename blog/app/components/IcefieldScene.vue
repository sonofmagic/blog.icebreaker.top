<script setup lang="ts">
const props = defineProps<{ paused: boolean }>()
const host = ref<HTMLDivElement | null>(null)
const ready = ref(false)
let destroyed = false
let visible = false
let loading = false
let contextAvailable = true
let frame = 0
let lastFrame = 0
let elapsed = 0
let pointerX = 0
let pointerY = 0
let scene: Awaited<ReturnType<typeof import('../utils/icefield').createIcefield>> | undefined
let intersection: IntersectionObserver | undefined
let resize: ResizeObserver | undefined
let media: MediaQueryList | undefined

function tick(time: number) {
  frame = 0
  if (!scene || !contextAvailable || !visible || document.hidden || props.paused || !media?.matches) {
    lastFrame = 0
    return
  }
  if (time - lastFrame >= 1000 / 30) {
    elapsed += lastFrame ? Math.min((time - lastFrame) / 1000, 0.1) : 0
    scene.render(elapsed, pointerX, pointerY)
    lastFrame = time
  }
  frame = requestAnimationFrame(tick)
}

function stop() {
  cancelAnimationFrame(frame)
  frame = 0
  lastFrame = 0
}

async function sync() {
  if (destroyed) {
    return
  }
  if (!media?.matches) {
    stop()
    resize?.disconnect()
    scene?.dispose()
    scene = undefined
    contextAvailable = true
    ready.value = false
    return
  }
  if (!contextAvailable || !visible || document.hidden || props.paused) {
    stop()
    return
  }
  if (!scene && !loading && host.value) {
    loading = true
    try {
      const { createIcefield } = await import('../utils/icefield')
      if (destroyed || !host.value || !media?.matches) {
        return
      }
      scene = createIcefield(host.value)
      resize = new ResizeObserver(() => scene?.resize())
      resize.observe(host.value)
      ready.value = true
    }
    catch {
      // The server-rendered poster remains available when WebGL cannot initialize.
      ready.value = false
    }
    finally {
      loading = false
    }
  }
  if (scene && !frame && visible && !document.hidden && !props.paused) {
    frame = requestAnimationFrame(tick)
  }
}

function move(event: PointerEvent) {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2
  pointerY = (event.clientY / window.innerHeight - 0.5) * 2
}

function contextLost(event: Event) {
  event.preventDefault()
  contextAvailable = false
  stop()
  ready.value = false
}

function contextRestored() {
  contextAvailable = true
  ready.value = true
  void sync()
}

watch(() => props.paused, () => void sync())
onMounted(() => {
  media = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)')
  media.addEventListener('change', sync)
  document.addEventListener('visibilitychange', sync)
  window.addEventListener('pointermove', move, { passive: true })
  host.value?.addEventListener('webglcontextlost', contextLost, true)
  host.value?.addEventListener('webglcontextrestored', contextRestored, true)
  intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    void sync()
  })
  if (host.value) {
    intersection.observe(host.value)
  }
})

onBeforeUnmount(() => {
  destroyed = true
  stop()
  intersection?.disconnect()
  resize?.disconnect()
  media?.removeEventListener('change', sync)
  document.removeEventListener('visibilitychange', sync)
  window.removeEventListener('pointermove', move)
  host.value?.removeEventListener('webglcontextlost', contextLost, true)
  host.value?.removeEventListener('webglcontextrestored', contextRestored, true)
  scene?.dispose()
})
</script>

<template>
  <div ref="host" class="icefield-scene" :class="{ 'icefield-scene--ready': ready }" aria-hidden="true" />
</template>

<style scoped>
.icefield-scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s;
}

.icefield-scene--ready {
  opacity: 1;
}

.icefield-scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
