import baseConfig from '@tsc/config/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  theme: {
    extend: {
      colors: {
        kinetic: {
          teal: '#00F2FF',
          ocean: '#006994',
          orange: '#FF4500',
          dark: '#0A1929',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      }
    }
  },
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../packages/ui/src/**/*.{js,jsx}',
  ],
};
