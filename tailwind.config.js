/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand red — sampled from the TCC mockups (vivid pure red, hue 0°).
        primary: {
          DEFAULT: '#E10000',
          dark: '#B80000',
          light: '#FF2A2A',
          soft: 'rgb(var(--primary-soft) / <alpha-value>)', // tinted red surface
        },
        // Warm amber — secondary accent (Wellhub-style highlights / streaks).
        accent: {
          DEFAULT: '#F5A623',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        // Always-dark surfaces (headers, heroes, avatars) — warm near-black.
        ink: {
          DEFAULT: '#0C0A09',
          soft: '#1C1714',
        },
        // Semantic, theme-aware tokens (switch via the `.dark` class).
        canvas: 'rgb(var(--canvas) / <alpha-value>)', // page background
        surface: 'rgb(var(--surface) / <alpha-value>)', // cards, inputs, sheets
        content: 'rgb(var(--content) / <alpha-value>)', // primary text
        muted: 'rgb(var(--muted) / <alpha-value>)', // secondary text
        line: 'rgb(var(--line) / <alpha-value>)', // borders / dividers
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        app: '420px',
      },
      spacing: {
        13: '3.25rem', // 52px — comfortable control height
        15: '3.75rem', // 60px
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,23,19,0.04), 0 8px 20px -10px rgba(28,23,19,0.10)',
        card: '0 2px 6px rgba(28,23,19,0.05), 0 16px 40px -18px rgba(28,23,19,0.18)',
        nav: '0 -6px 28px -14px rgba(28,23,19,0.20)',
        primary: '0 10px 24px -8px rgba(225,0,0,0.50)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
