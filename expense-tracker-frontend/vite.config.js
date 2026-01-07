import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true, // Öffnet Visualizer automatisch nach Build
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React Vendor Bundle
          'react-vendor': ['react', 'react-dom'],
          // Utils Bundle
          utils: ['./src/utils/errors.js', './src/utils/performance.js'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warning bei > 500KB
    sourcemap: true, // Source Maps für Debugging
  },
  server: {
    port: 3000,
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import'],
      },
    },
  },
});
