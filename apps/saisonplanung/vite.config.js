import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/saisonplanung/',
  server: {
    port: 3020
  },
  build: {
    outDir: 'dist'
  }
});
