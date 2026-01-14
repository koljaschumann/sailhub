import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/spendenportal/',
  server: {
    port: 3080
  },
  build: {
    outDir: 'dist'
  }
});
