# Architecture Deep-Dive

This document explains the technical implementation details of running Vue 2.7 and Vue 3 simultaneously in a single Vite-powered SPA.

## Table of Contents

1. [Dual Plugin Configuration](#1-dual-plugin-configuration)
2. [The Plugin Patch](#2-the-plugin-patch)
3. [Shared State with Pinia](#3-shared-state-with-pinia)
4. [Router Synchronization](#4-router-synchronization)
5. [Build Configuration](#5-build-configuration)
6. [TypeScript Configuration](#6-typescript-configuration)

---

## 1. Dual Plugin Configuration

### The Challenge

Vite uses plugins to transform `.vue` files. By default, `@vitejs/plugin-vue` (Vue 3) and `@vitejs/plugin-vue2` (Vue 2) both attempt to process all `.vue` files, causing conflicts.

### The Solution

Use the `include` and `exclude` options to partition which files each plugin processes:

```typescript
// vite.config.ts
import vue3 from '@vitejs/plugin-vue'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [
    vue3({
      exclude: ['src/vue2/**/*.vue'],  // Skip Vue 2 files
    }),
    vue2({
      include: ['src/vue2/**/*.vue'],  // Only process Vue 2 files
    }),
  ],
})
```

### How It Works

```
.vue file requested
        │
        ▼
┌───────────────────┐
│ Is path in        │
│ src/vue2/**/*.vue?│
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
   YES          NO
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│ Vue 2   │ │ Vue 3   │
│ Plugin  │ │ Plugin  │
└─────────┘ └─────────┘
```

### File Organization Convention

```
src/
├── components/     # Vue 3 components
├── views/          # Vue 3 views
├── routers/        # Vue 3 router
└── vue2/           # All Vue 2 code isolated here
    ├── components/
    ├── views/
    └── routers/
```

This convention ensures clear separation and makes the `include`/`exclude` patterns simple.

---

## 2. The Plugin Patch

### The Problem

`@vitejs/plugin-vue2` is designed for projects where Vue 2 is installed as `vue`. It resolves the compiler like this:

```javascript
// Original plugin code
const compiler = tryRequire("vue/compiler-sfc", root)
```

In our setup, Vue 2 is aliased as `vue2`, so this resolution fails.

### The Patch

We use `patch-package` to modify the installed plugin:

```diff
// patches/@vitejs+plugin-vue2+2.3.3.patch

- const compiler = tryRequire("vue/compiler-sfc", root)
+ const compiler = tryRequire("vue2/compiler-sfc", root)
```

### Additional Filter Fix

The original plugin also has an issue where it checks `query.vue` before applying filters:

```diff
- if (!filter(filename) && !query.vue) {
+ if (!filter(filename)) {
```

This ensures our `include` pattern is respected for all Vue file queries.

### Applying the Patch

The patch is automatically applied via npm's `postinstall` hook:

```json
{
  "scripts": {
    "postinstall": "patch-package",
    "prepare": "patch-package"
  }
}
```

---

## 3. Shared State with Pinia

### Why Pinia?

Pinia is the official state management solution for Vue 3, but it also supports Vue 2.7 via `PiniaVuePlugin`. This makes it the ideal choice for shared state.

### Singleton Store Pattern

A single Pinia instance is created and shared between both Vue applications:

```typescript
// src/pinia.ts
import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;  // Same instance used everywhere
```

### Vue 3 Integration

```typescript
// src/main.ts
import { createApp } from 'vue'
import { PiniaVuePlugin } from 'pinia'
import pinia from './pinia'

const app = createApp(App)
app.use(PiniaVuePlugin)
app.use(pinia)
app.mount('#app')
```

### Vue 2 Integration

```typescript
// src/vue2/main.ts
import Vue from 'vue2'
import { PiniaVuePlugin } from 'pinia'
import pinia from '@/pinia'  // Same instance!

Vue.use(PiniaVuePlugin)

new Vue({
  pinia,  // Shared Pinia instance
  render: (h) => h(App2),
}).$mount('#app-vue2')
```

### Store Definition with Singleton Guarantee

To ensure the store behaves identically in both frameworks, we use a singleton pattern:

```typescript
// src/stores/counter.ts
let counterStore: CounterState | null = null

export const useCounterStore = defineStore('counter', () => {
  if (counterStore) return counterStore  // Return existing instance

  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  counterStore = { count, doubleCount, increment }
  return counterStore
})
```

### State Synchronization Flow

```
Vue 3 Component                    Vue 2 Component
      │                                  │
      │  counterStore.increment()        │
      ▼                                  │
┌─────────────┐                          │
│ Pinia Store │ ◄────────────────────────┘
│ (Singleton) │       counterStore.count
└──────┬──────┘
       │
       │ Reactive update
       ▼
┌──────────────────────────────────────────┐
│ Both components re-render automatically  │
└──────────────────────────────────────────┘
```

---

## 4. Router Synchronization

### The Challenge

Vue 3 Router and Vue 2 Router are separate packages with different APIs. Each maintains its own history state.

### Dual Mount Points

The Vue 3 app mounts to `#app`, while Vue 2 mounts to a container inside it:

```html
<!-- index.html -->
<div id="app"></div>

<!-- Vue 3's App.vue template -->
<div class="page">
  <router-view />        <!-- Vue 3 routes render here -->
  <Vue2Container />      <!-- Contains #app-vue2 -->
</div>

<!-- Vue2Container.vue -->
<div id="app-vue2"></div>  <!-- Vue 2 routes render here -->
```

### Programmatic Navigation Sync

Standard `<router-link>` only updates one router. For synchronized navigation, we use programmatic routing:

```typescript
// src/App.vue
import router2 from '@vue2/routers'
import router from './routers'

const changeUrl = (url: string) => {
  router2.push(url)  // Update Vue 2 router
  router.push(url)   // Update Vue 3 router
}
```

### Route Configuration Strategy

Routes are configured based on which framework handles them:

**Vue 3 Router** - Handles all routes, renders Vue 3 pages or empty container for Vue 2:

```typescript
// src/routers/index.ts
const routes = [
  { path: '/', component: Home },           // Vue 3 page
  { path: '/about', component: About },     // Vue 3 page
  { path: '/vue2', component: Vue2Container },  // Empty container
]
```

**Vue 2 Router** - Only handles Vue 2-specific routes:

```typescript
// src/vue2/routers/index.ts
const routes = [
  {
    path: '/vue2',
    component: Base,
    children: [
      { path: '/vue2', component: Home },
      { path: '/vue2/about', component: About },
    ],
  },
]
```

### Migration Path

As you migrate pages from Vue 2 to Vue 3:

1. Create the Vue 3 version of the component
2. Update Vue 3 router to use the new component
3. Remove the route from Vue 2 router
4. Eventually, remove the Vue 2 version entirely

---

## 5. Build Configuration

### Alias Resolution

Clean imports are enabled via Vite aliases and TypeScript path mapping:

```typescript
// vite.config.ts
resolve: {
  alias: {
    vue: 'vue/dist/vue.esm-bundler.js',
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@vue2': fileURLToPath(new URL('./src/vue2', import.meta.url)),
  },
  dedupe: ['vue', 'vue2'],  // Prevent duplicate Vue instances
}
```

### Manual Chunk Separation

For optimal caching, vendor code is split by framework:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vue2-vendor': ['vue2', 'vue2-router'],
        'vue3-vendor': ['vue', 'vue-router'],
        'shared-vendor': ['pinia'],
      },
    },
  },
}
```

### Output Structure

```
dist/
├── assets/
│   ├── vue2/
│   │   └── vue2-vendor-[hash].js    # Vue 2 + Vue Router 3
│   ├── vue3-vendor-[hash].js        # Vue 3 + Vue Router 4
│   ├── shared-vendor-[hash].js      # Pinia
│   └── index-[hash].js              # Application code
└── index.html
```

### Chunk Naming Convention

Files are organized by framework in the output:

```typescript
chunkFileNames: (chunkInfo) => {
  if (chunkInfo.name?.includes('vue2')) {
    return 'assets/vue2/[name]-[hash].js'
  }
  return 'assets/[name]-[hash].js'
}
```

---

## 6. TypeScript Configuration

### Path Aliases

TypeScript needs to understand the same aliases as Vite:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@vue2/*": ["./src/vue2/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue"]
}
```

### Vue 2 Type Support

Vue 2.7 includes TypeScript declarations. The `vue2` alias is recognized because npm resolves the package correctly.

### Script Setup in Vue 2.7

Vue 2.7 supports `<script setup>` syntax, allowing you to write Vue 2 components that are nearly identical to Vue 3:

```vue
<!-- Works in both Vue 2.7 and Vue 3 -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

This dramatically reduces the migration effort when moving components to Vue 3.

---

## Summary

| Component | Technique |
|-----------|-----------|
| Dual compilation | Vite plugin `include`/`exclude` |
| Package aliasing | `vue2: npm:vue@2.7.16` |
| Plugin compatibility | `patch-package` for compiler resolution |
| Shared state | Singleton Pinia instance |
| Router sync | Programmatic `push()` on both routers |
| Build optimization | Manual chunk separation |
| Type safety | Shared TypeScript path aliases |

This architecture enables a gradual migration where features can be moved from Vue 2 to Vue 3 one at a time, with shared state ensuring continuity throughout the process.

