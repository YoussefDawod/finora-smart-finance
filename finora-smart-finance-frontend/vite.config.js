import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    // CSP-Meta-Tag im Development entfernen — Vite's HMR injiziert eigene
    // Inline-Scripts + Blob-Worker + WebSocket, die mit festen SHA-Hashes kollidieren.
    // Im Production-Build bleibt die CSP-Policy unverändert in index.html.
    {
      name: 'csp-dev-strip',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (ctx.server) {
            return html.replace(
              /[ \t]*<!-- Content Security Policy -->[\s\S]*?form-action 'self'"\s*\/>/,
              '    <!-- CSP: nur im Production-Build aktiv (Vite HMR braucht inline scripts) -->'
            );
          }
          return html;
        },
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Single-Page-App: alle Navigationen auf index.html leiten
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Statische Assets cachen (JS, CSS, HTML, Bilder, Fonts)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Runtime-Caching für statische Ressourcen
        runtimeCaching: [
          {
            // Lokalisierungsdateien: StaleWhileRevalidate
            urlPattern: /\/locales\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'finora-i18n-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 24 Stunden
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: false, // Existierendes manifest.json nutzen
      devOptions: {
        enabled: false, // SW nur im Build aktiv
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  css: {
    modules: {
      // Verwende immer eindeutige Klassennamen, um Kollisionen zwischen Modulen (z.B. mehrere "header") zu vermeiden.
      generateScopedName: process.env.NODE_ENV === 'production'
        ? '[hash:base64:5]'
        : '[name]__[local]__[hash:base64:5]',
      
      // Klassennamen in camelCase umwandeln
      localsConvention: 'camelCaseOnly',
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `
          @use "@styles/variables.scss" as *;
          @use "@styles/mixins.scss" as *;
        `,
      },
    },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // Ensure headers are properly forwarded
        headers: {
          Connection: 'keep-alive',
        },
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[Proxy Error]', err.message, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy →]', req.method, req.url, 'from:', req.headers.origin || req.headers.host);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[Proxy ←]', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          icons: ['react-icons/fi'],
        },
      },
    },
  },
  // ============================================
  // VITEST CONFIGURATION
  // ============================================
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/index.js',
      ],
    },
  },
});
