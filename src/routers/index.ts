import { createWebHistory, createRouter } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import Vue2Container from '@/components/Vue2Container.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/vue2',
    name: 'vue2',
    component: Vue2Container,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
