import './assets/main.css'

import { createApp } from 'vue'
import { PiniaVuePlugin } from 'pinia'
import App from './App.vue'
import router from './routers'
import pinia from './pinia'

export function init() {
  const app = createApp(App)

  app.use(router)

  app.use(PiniaVuePlugin)
  app.use(pinia)

  app.mount('#app')
}
