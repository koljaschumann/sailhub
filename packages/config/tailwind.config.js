/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"DM Sans"', 'system-ui', 'sans-serif'],
        logo: ['"Pacifico"', 'cursive'],
      },
      colors: {
        // SailHub Brand Colors
        navy: {
          950: '#060d1a',
          900: '#0a1628',
          850: '#0c1b30',
          800: '#0f2140',
          700: '#162d54',
          600: '#1e3a5f',
        },
        // Primary accent - Mint Green (SailHub signature)
        mint: {
          500: '#00D46A',
          400: '#00E676',
          300: '#69F0AE',
          200: '#B9F6CA',
          100: '#E8F5E9',
        },
        // Legacy gold (keep for backwards compatibility)
        gold: {
          500: '#c49a47',
          400: '#d4a853',
          300: '#e8c777',
          200: '#f0d89a',
        },
        cream: '#faf8f5',
        sage: '#e8f0eb',
        sea: {
          400: '#5aa3b9',
          300: '#6bb3c9',
          200: '#8bc7d9',
        },
        coral: '#e07b67',
        success: '#00E676',
        teal: {
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
        },
        light: {
          bg: '#f5f8f6',
          card: '#ffffff',
          border: '#d4e5dc',
          text: '#1a2e23',
          muted: '#5a7a68',
        },
      },
      backgroundImage: {
        'sailhub-gradient': 'linear-gradient(135deg, #0a1628 0%, #0c1b30 50%, #0f2140 100%)',
        'sailhub-gradient-light': 'linear-gradient(135deg, #f5f8f6 0%, #e8f0eb 100%)',
        'mint-glow': 'radial-gradient(ellipse at center, rgba(0, 230, 118, 0.15) 0%, transparent 70%)',
        'dots-pattern': 'radial-gradient(circle, #00E676 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots': '20px 20px',
      },
      boxShadow: {
        'sailhub': '0 4px 24px rgba(0, 0, 0, 0.12)',
        'sailhub-hover': '0 8px 40px rgba(0, 0, 0, 0.16)',
        'card-glow': '0 0 40px rgba(0, 230, 118, 0.1)',
        'mint-glow': '0 0 20px rgba(0, 230, 118, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'dots-drift': 'dots-drift 20s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 230, 118, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.1)' },
        },
        'dots-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
