# Vue 2 + Vue 3 Incremental Migration Demo

A proof-of-concept demonstrating how to run Vue 2.7 and Vue 3 simultaneously in a single SPA, enabling **feature-by-feature migration** without service disruption.

## The Problem

Migrating a large Vue 2 codebase to Vue 3 traditionally requires one of two approaches:

1. **Big Bang Rewrite**: Migrate everything at once, deploy when complete
   - High risk, long development cycles, no incremental value delivery

2. **Micro-frontend Split**: Run Vue 2 and Vue 3 as separate apps
   - Complex infrastructure, state synchronization challenges, multiple build pipelines

This demo presents a **third approach**: coexistence within a single application.

## What This Demo Proves

- Vue 2.7 and Vue 3 components can coexist in the same SPA
- A single Vite build can compile both versions simultaneously
- Pinia stores can be shared across framework boundaries
- Routes can be synchronized between Vue 2 Router and Vue 3 Router
- Production builds with proper chunk separation are achievable

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│                      ┌───────────┐                          │
│                      │  setup.ts │                          │
│                      └─────┬─────┘                          │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│      ┌──────────────┐           ┌──────────────┐            │
│      │   Vue 3 App  │           │   Vue 2 App  │            │
│      │   #app       │           │   #app-vue2  │            │
│      └──────┬───────┘           └──────┬───────┘            │
│             │                          │                    │
│      ┌──────┴───────┐           ┌──────┴───────┐            │
│      │ Vue 3 Router │           │ Vue 2 Router │            │
│      └──────┬───────┘           └──────┬───────┘            │
│             │                          │                    │
│             └──────────┬───────────────┘                    │
│                        ▼                                    │
│              ┌─────────────────┐                            │
│              │  Shared Pinia   │                            │
│              │     Store       │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Vue 2.7** (not 2.6) | Required for Composition API and `<script setup>` compatibility |
| **npm aliases** | `vue2: npm:vue@2.7.16` allows importing both versions cleanly |
| **Vite plugin filtering** | `include`/`exclude` patterns route files to correct compiler |
| **patch-package** | Fixes `@vitejs/plugin-vue2` to use `vue2` compiler instead of `vue` |
| **Singleton Pinia** | Single store instance shared by both Vue apps |
| **Programmatic routing** | `router.push()` called on both routers for sync |

## Requirements

- Node.js v20+
- npm

## Quick Start

```bash
# Install dependencies (legacy-peer-deps required for Vue version conflicts)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Production build
npm run build
```

> **Note**: `--legacy-peer-deps` bypasses peer dependency conflicts from `@vitejs/plugin-vue2` expecting Vue 2 as `vue` instead of `vue2`.

## Project Structure

```
src/
├── setup.ts              # Entry point - initializes both Vue apps
├── main.ts               # Vue 3 app initialization
├── pinia.ts              # Shared Pinia instance
├── App.vue               # Vue 3 root component
├── routers/
│   └── index.ts          # Vue 3 Router configuration
├── views/                # Vue 3 pages
├── stores/
│   └── counter.ts        # Shared Pinia store (singleton pattern)
└── vue2/
    ├── main.ts           # Vue 2 app initialization
    ├── App2.vue          # Vue 2 root component
    ├── routers/
    │   └── index.ts      # Vue 2 Router configuration
    └── views/            # Vue 2 pages
```

## Applying This Approach to Your Project

### Step 1: Add Vue 2 as an Alias

```json
{
  "dependencies": {
    "vue": "^3.x.x",
    "vue2": "npm:vue@2.7.16",
    "vue2-router": "npm:vue-router@^3.6.5"
  }
}
```

### Step 2: Configure Vite Plugins

```typescript
// vite.config.ts
plugins: [
  vue3({
    exclude: ['src/vue2/**/*.vue'],  // Exclude legacy files from Vue 3 compiler
  }),
  vue2({
    include: ['src/vue2/**/*.vue'],  // Only compile legacy files with Vue 2
  }),
]
```

### Step 3: Patch the Vue 2 Plugin

The `@vitejs/plugin-vue2` resolves `vue/compiler-sfc` by default. Patch it to use `vue2/compiler-sfc`:

```bash
# After installing, create a patch
npx patch-package @vitejs/plugin-vue2
```

See `patches/@vitejs+plugin-vue2+2.3.3.patch` for the exact changes.

### Step 4: Create Shared Pinia Instance

```typescript
// src/pinia.ts
import { createPinia } from 'pinia';
const pinia = createPinia();
export default pinia;
```

Use the same instance in both Vue 2 and Vue 3 apps.

### Step 5: Initialize Both Apps

```typescript
// src/setup.ts
import { init as initVue2 } from '@vue2/main.ts'
import { init as initVue3 } from '@/main.ts'

initVue3()  // Mounts to #app
initVue2()  // Mounts to #app-vue2
```

### Step 6: Migrate Incrementally

1. Move a feature's components to `src/` (Vue 3 directory)
2. Update imports to use Vue 3 APIs
3. Test the feature in isolation
4. Update routing to use Vue 3 version
5. Repeat for next feature

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Larger bundle size | ~80KB additional (Vue 2 runtime) | Tree-shaking, lazy loading |
| Dual HMR processing | Slightly slower dev rebuilds | Minimal in practice |
| Vue 2 plugin compatibility | Some plugins need Vue 2-specific versions | Check plugin documentation |
| Router sync complexity | Manual sync required | Centralized navigation helper |

## Build Output

Production builds separate chunks for optimal caching:

```
dist/
├── assets/
│   ├── vue2/
│   │   └── vue2-vendor-[hash].js    # Vue 2 runtime + router
│   ├── vue3-vendor-[hash].js        # Vue 3 runtime + router
│   ├── shared-vendor-[hash].js      # Pinia (shared)
│   └── index-[hash].js              # Application code
```

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical deep-dive into the implementation
- [Vue 3 Migration Guide](https://v3-migration.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)

## License

MIT
