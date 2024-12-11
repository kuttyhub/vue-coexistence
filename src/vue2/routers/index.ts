import Vue from 'vue2'
import VueRouter, { type RouteConfig } from 'vue2-router'

import Base from '@vue2/views/Base.vue'
import Home from '@vue2/views/Home.vue'
import About from '@vue2/views/About.vue'

Vue.use(VueRouter)
const routes: RouteConfig[] = [
  {
    path: '/vue2',
    component: Base,
    children: [
      {
        path: '/vue2',
        component: Home,
      },
      {
        path: '/vue2/about',
        component: About,
      },
    ],
  },
]

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes,
})

export default router
