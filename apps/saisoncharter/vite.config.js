import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/saisoncharter/',
  server: {
    port: 3060
  },
  build: {
    outDir: 'dist'
  }
});
