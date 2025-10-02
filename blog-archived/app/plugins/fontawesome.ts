import { defineNuxtPlugin } from '#app'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const iconModules = import.meta.glob('@/assets/icon/lib/*.js', {
  eager: true,
})

export default defineNuxtPlugin((nuxtApp) => {
  // Import modules so that they register icons via side effects
  Object.values(iconModules).forEach(() => {})
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
