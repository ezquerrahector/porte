import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH: '/porte/' mientras se publica en GitHub Pages; '/' cuando tengamos dominio propio.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Porte',
        short_name: 'Porte',
        description: 'Viste con lo que tienes. Vende lo que ya no usas.',
        lang: 'es-MX',
        theme_color: '#141414',
        background_color: '#141414',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/storage\//],
        // El modelo de fondo de estudio y su motor (~17 MB) se descargan solo al usarse
        globIgnores: ['**/ort/**', '**/models/**']
      }
    })
  ]
});
