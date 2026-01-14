import baseConfig from '@tsc/config/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        luxury: {
          navy: '#002046',
          gold: '#F0E68C',
          cream: '#F5F5F0',
          white: '#FFFFFF',
        }
      }
    }
  },
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/ui/src/**/*.{js,jsx}',
  ],
};
