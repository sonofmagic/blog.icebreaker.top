import mobile from 'is-mobile'
import svg4everybody from 'svg4everybody'
import { useDevice } from '@/composables/useDevice'

const CDN_HOSTS = ['fastly.jsdelivr.net', 'gcore.jsdelivr.net', 'cdn.jsdelivr.net']
const fallbackOffsets = new WeakMap<EventTarget, number>()

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) {
    return
  }

  svg4everybody()

  const { setIsMobile } = useDevice()

  setIsMobile(mobile())

  const onError = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLImageElement)) {
      return
    }

    const src = target.src
    if (!src.includes('jsdelivr.net')) {
      return
    }

    const currentOffset = fallbackOffsets.get(target) ?? 0
    if (currentOffset >= CDN_HOSTS.length) {
      return
    }

    const url = new URL(src)
    for (let index = currentOffset; index < CDN_HOSTS.length; index++) {
      const host = CDN_HOSTS[index]
      if (host === url.hostname) {
        continue
      }

      url.hostname = host
      fallbackOffsets.set(target, index + 1)
      target.src = url.toString()
      break
    }
  }

  window.addEventListener('error', onError, true)

  nuxtApp.hook('app:beforeUnmount', () => {
    window.removeEventListener('error', onError, true)
  })
})
