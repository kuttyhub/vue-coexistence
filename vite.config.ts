import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue3 from '@vitejs/plugin-vue'
import vue2 from '@vitejs/plugin-vue2'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue3({
      exclude: ['src/vue2/**/*.vue'],
    }),
    vue2({
      include: ['src/vue2/**/*.vue'],
    }),
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@vue2': fileURLToPath(new URL('./src/vue2', import.meta.url)),
    },
    dedupe: ['vue', 'vue2'], // Deduplicate Vue instances
  },
  build: {
    rollupOptions: {
      // Output configuration for production build
      output: {
        manualChunks: {
          'vue2-vendor': ['vue2', 'vue2-router'],
          'vue3-vendor': ['vue', 'vue-router'],
          'shared-vendor': ['pinia'],
        },
        // Ensure Vue 2 and Vue 3 chunks are properly separated
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes('vue2')) {
            return 'assets/vue2/[name]-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        },
        // Handle assets from different Vue versions
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('vue2')) {
            return 'assets/vue2/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        // Configure entry points
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes('vue2')) {
            return 'assets/vue2/[name]-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        },
      },
      input: {
        main: 'index.html',
      },
    },
    // Ensure sourcemaps are generated for debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 2000,
  },
})
