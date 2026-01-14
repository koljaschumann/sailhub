import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/jahresauswertung/',
  server: {
    port: 3090
  },
  build: {
    outDir: 'dist'
  }
});
