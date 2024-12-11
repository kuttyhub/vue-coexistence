<template>
  <div class="page">
    <div class="left-nav">
      <span @click="changeUrl('/')">Home</span>
      <span @click="changeUrl('/about')">about</span>
      <span @click="changeUrl('/vue2')">vue2-route</span>
    </div>
    <div class="page-content">
      <router-view />
      <Vue2Container />
    </div>
  </div>
</template>

<script setup lang="ts">
import Vue2Container from '@/components/Vue2Container.vue'
import router2 from '@vue2/routers'
import router from './routers'

/**
 * **NOTE** to reflect the route change on both router instance we need to programmatically update the history.
 * <router-link> will not help here as its only updating the state in specific router instance.
 */
const changeUrl = (url: string) => {
  router2.push(url)
  router.push(url)
}
</script>

<style lang="css">
.page {
  display: flex;
  height: 100%;
  width: 100%;
}
.left-nav {
  width: 120px;
  border-right: 1px solid #fff;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.page-content {
  flex: 1;
  padding: 15px;
}
</style>
