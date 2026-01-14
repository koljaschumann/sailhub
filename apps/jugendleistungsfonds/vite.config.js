import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/jugendleistungsfonds/',
  server: {
    port: 3070
  },
  build: {
    outDir: 'dist'
  }
});
