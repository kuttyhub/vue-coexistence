import Vue from 'vue2'
import router from './routers'
import App2 from './App2.vue'
import { PiniaVuePlugin } from 'pinia'
import pinia from '@/pinia'

export function init() {
  Vue.use(PiniaVuePlugin)

  new Vue({
    router,
    pinia,
    render: (h) => h(App2),
  }).$mount('#app-vue2')
}
