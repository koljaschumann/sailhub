import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/startgelder/',
  envDir: '../../', // Load .env from monorepo root
  server: {
    port: 3032,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['jspdf', 'jspdf-autotable', 'pdf-lib', 'pdfjs-dist'],
          'ocr': ['tesseract.js'],
        },
      },
    },
  },
});
