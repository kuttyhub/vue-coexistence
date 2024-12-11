<template>
  <div>
    <p>Home page</p>
    <p>Counter {{ counterStore.count }}, computed double- {{ counterStore.doubleCount }}</p>

    <button @click="counterStore.increment">+</button>
    <button @click="counterStore.decrement">-</button>
  </div>
</template>
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { watch } from 'vue'
const counterStore = useCounterStore()

watch(
  () => counterStore.count,
  (newVal, oldVal) => {
    console.log('count', newVal, oldVal)
  },
)
</script>
