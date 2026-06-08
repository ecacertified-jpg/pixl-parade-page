import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-jv.png', 'robots.txt'],
      manifest: {
        name: 'Joie de Vivre - Célébrez ensemble',
        short_name: 'Joie de Vivre',
        description: 'Célébrez et offrez des moments de bonheur à vos proches',
        theme_color: '#FF6B9D',
        background_color: '#FFF5F8',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: '/',
        dir: 'ltr',
        prefer_related_applications: false,
        launch_handler: { client_mode: 'navigate-existing' },
        categories: ['lifestyle', 'social', 'shopping'],
        lang: 'fr',
        shortcuts: [
          { name: 'Accueil', short_name: 'Accueil', description: 'Mon fil de joie', url: '/home', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Cagnottes', short_name: 'Cagnottes', description: 'Mes cagnottes en cours', url: '/dashboard?tab=funds', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Anniversaires', short_name: 'Anniversaires', description: 'Anniversaires à venir', url: '/dashboard?tab=birthdays', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Boutique', short_name: 'Boutique', description: 'Découvrir des cadeaux', url: '/shop', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] }
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,avif,woff,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigationPreload: true,
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /^\/~oauth/, /^\/auth/, /\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache-v1',
              networkTimeoutSeconds: 2,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/rest\/v1\/(profiles|contacts|business_accounts|business_public_info)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-core-v1',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/functions\/v1\/(home-preview|birthday-preview|event-preview|join-preview|og-inspector)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'edge-previews-v1',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/rest\/v1\/favorites/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'favorites-cache-v2',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/rest\/v1\/collective_funds/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'funds-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/rest\/v1\/products/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'products-cache-v2',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /^https:\/\/vaimfeurvzokepqqqrsl\.supabase\.co\/storage\/v1\/object\/public/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance across all dependencies
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
      "@radix-ui/react-compose-refs": path.resolve(__dirname, "./src/lib/radix-compose-refs-patch.ts"),
      "@radix-ui/react-slot": path.resolve(__dirname, "./src/lib/radix-slot-patch.tsx"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
    ],
    exclude: [
      '@radix-ui/react-compose-refs',
      '@radix-ui/react-slot',
    ],
    force: true
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));
