import path from 'path'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Vue from 'vue'
const requireAll = require.context('./lib', false, /\.js$/)
requireAll.keys().reduce((acc, cur) => {
  const moduleName = path.basename(cur, path.extname(cur))
  acc[moduleName] = requireAll(cur).default
  return acc
}, {})
Vue.component('FontAwesomeIcon', FontAwesomeIcon)
