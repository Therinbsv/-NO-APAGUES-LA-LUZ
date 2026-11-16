import { defineConfig } from 'vite';

// Configuración de Vite.
// base './' permite publicar la carpeta dist/ en cualquier ruta (GitHub Pages, itch.io, etc.).
export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: {
    // Phaser pesa ~1 MB minificado: se separa en su propio chunk para cachearlo aparte.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  }
});
