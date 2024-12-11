import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'

// Define the store state interface
interface CounterState {
  count: Ref<number>
  doubleCount: ComputedRef<number>
  increment: () => void
  decrement: () => void
  resetStore: () => void
}

// Define a type for the store singleton
type CounterStoreSingleton = CounterState | null

// Store singleton instance
let counterStore: CounterStoreSingleton = null

export const useCounterStore = defineStore('counter', () => {
  if (counterStore) return counterStore

  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  // Reset function to clear the singleton instance (useful for testing)
  function resetStore() {
    counterStore = null
  }

  counterStore = {
    count,
    doubleCount,
    increment,
    decrement,
    resetStore,
  }

  return counterStore
})
