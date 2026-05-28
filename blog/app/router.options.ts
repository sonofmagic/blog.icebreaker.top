import type { RouterConfig } from '@nuxt/schema'

function resolveHashElement(hash: string) {
  if (typeof document === 'undefined') {
    return null
  }
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) {
    return null
  }

  const candidates = [id]
  try {
    const decoded = decodeURIComponent(id)
    if (decoded !== id) {
      candidates.push(decoded)
    }
  }
  catch {
    candidates.push(id)
  }

  for (const candidate of candidates) {
    const element = document.getElementById(candidate)
    if (element) {
      return element
    }
  }
  return null
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return { ...savedPosition }
    }

    if (!import.meta.client) {
      return { top: 0, left: 0 }
    }

    const isSamePath = to.path === from.path

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (to.hash) {
          const target = resolveHashElement(to.hash)
          if (target) {
            const header = document.querySelector('.app-header') as HTMLElement | null
            const offset = header ? header.getBoundingClientRect().height + 36 : 36
            const top = window.scrollY + target.getBoundingClientRect().top - offset
            resolve({ left: 0, top: Math.max(top, 0), behavior: isSamePath ? 'smooth' : 'auto' })
            return
          }
        }

        resolve({ left: 0, top: 0, behavior: isSamePath ? 'smooth' : 'auto' })
      })
    })
  },
}
