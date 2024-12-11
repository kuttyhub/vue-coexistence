# Vue 2 + Vue 3 Coexistence Demo

This proof of concept demonstrates running Vue 2 and Vue 3 in the same repository using a single Vite configuration. The project uses a unified Pinia store instance for state management, supporting both Vue 2 Router and Vue 3 Router.

## Requirements

- Node v20

## Project Setup

```sh
npm install --legacy-peer-deps
```

> Note: `--legacy-peer-deps` is required to bypass peer dependency conflicts from @vitejs/plugin-vue2

## Development

```sh
npm run dev
```

## Production Build [WIP]

```sh
npm run build
```

> ⚠️ Build configuration is not ready yet. See "Open Issues" section below.

## Technical Implementation

### 1. Package Aliases

We use npm aliases to manage multiple Vue versions:

```json
{
  "dependencies": {
    "vue": "^3.3.13", // Main Vue 3 package
    "vue2": "npm:vue@2.7.14", // Vue 2 aliased
    "vue2-router": "npm:vue-router@3.6.5" // Vue 2 Router aliased
  }
}
```

### 2. Project Structure

```
src/
├── vue2/          # Vue 2 specific code
│   ├── components/
│   ├── router/
│   └── main.ts
├── components/    # Vue 3 components
├── router/       # Vue 3 router
└── main.ts       # Vue 3 entry
```

### 3. Vite Configuration

The project uses a single vite.config.ts to handle both Vue versions:

```typescript
plugins: [
  vue({
    exclude: ['src/vue2/**/*.vue'], // Exclude Vue 2 files
  }),
  vue2({
    include: ['src/vue2/**/*.vue'], // Only process Vue 2 files
  }),
]
```

### 4. Required Patches

A patch for @vitejs/plugin-vue2 is required to make it work alongside Vue 3:

- Location: `patches/@vitejs+plugin-vue2+2.0.3.patch`
- Purpose: Modifies the plugin to use the correct compiler and prevent conflicts
- See patch file for specific changes

## Open Issues

- [ ] fix build configuration.

## Known Limitations

1. Development builds might be slower due to dual processing
2. Bundle size is larger due to including both Vue versions
3. Some Vue 2 plugins might require additional configuration or patches
