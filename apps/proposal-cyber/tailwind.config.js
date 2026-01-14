import baseConfig from '@tsc/config/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#000000',
          carbon: '#111111',
          neon: '#39FF14',
          holo: '#00F0FF',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['Rajdhani', 'sans-serif'],
      }
    }
  },
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/ui/src/**/*.{js,jsx}',
  ],
};
