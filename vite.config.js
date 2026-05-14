import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // injectManifest lets us write a custom SW with full Workbox access
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      // Generates dist/sw.js and replaces self.__WB_MANIFEST with the asset list
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Main bundle is ~2 MB (pre-existing). Raise limit so SW precaches it.
        // Long-term fix: code-split with manualChunks in rollupOptions.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB
      },

      // Registration — the workbox-window Prompt lets us handle updates ourselves
      registerType: 'prompt',
      devOptions: {
        enabled: true,   // SW active in dev so you can test offline flow
        type: 'module',
      },

      // Web App Manifest
      manifest: {
        name: 'MastexoPOS',
        short_name: 'MastexoPOS',
        description: 'Sistema de gestión para restaurantes',
        theme_color: '#8B5CF6',
        background_color: '#0A0A12',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'es',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Nuevo pedido',
            url: '/?tab=Pedidos',
            description: 'Crear un nuevo pedido',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
      // Cult UI components import from "motion/react" — bridge to framer-motion v11
      "motion/react": "framer-motion",
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
