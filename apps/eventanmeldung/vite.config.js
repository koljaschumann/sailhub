import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eventanmeldung/',
  server: {
    port: 3050,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
