import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fbf0f1', 100: '#f5dde0', 200: '#e9b8bf', 300: '#d88b97',
          400: '#c15a6c', 500: '#a13c4e', 600: '#7d2436', // primary
          700: '#671c2c', 800: '#560c1a', 900: '#4a0e1c', 950: '#2b0510',
        },
        gold: {
          50: '#fdf9ed', 100: '#faf0ce', 200: '#f4dd9c', 300: '#edc463',
          400: '#e6ab3a', 500: '#d99420', 600: '#bd7418', // accent
          700: '#9c5817', 800: '#7f4619', 900: '#6b3b19',
        },
        ivory: '#fdfaf4',
        emerald2: {
          50: '#eafaf2', 100: '#c8f0dc', 200: '#94ddbc', 300: '#5cc298',
          400: '#31a37c', 500: '#1c8567', // secondary
          600: '#146a54', 700: '#125345', 800: '#114338', 900: '#0f382f',
        },
        event: {
          mehendi: '#3f7d3a',
          mehendiLight: '#6fae52',
          haldi: '#e8a723',
          haldiLight: '#f4c95f',
          hasthmelap: '#7d2436',
          hasthmelapLight: '#bd7418',
          gruhshanti: '#c2185b',
          gruhshantiLight: '#ff8a4c',
          sangeet: '#1a2456',
          sangeetLight: '#8e97c4',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(122, 33, 51, 0.12)',
        gold: '0 0 0 1px rgba(217,148,32,0.35), 0 8px 24px -8px rgba(217,148,32,0.35)',
      },
      backgroundImage: {
        'maroon-gold': 'linear-gradient(135deg, #7d2436 0%, #bd7418 100%)',
        'gold-maroon': 'linear-gradient(135deg, #d99420 0%, #7d2436 100%)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
