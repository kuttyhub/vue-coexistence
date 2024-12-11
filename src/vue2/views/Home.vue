<template>
  <div>
    <p>vue2 Home page - with shared pinia</p>
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
    console.log('vue2 - count', newVal, oldVal)
  },
)
</script>
