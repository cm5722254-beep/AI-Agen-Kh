/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{ts,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        khmer: ['"Noto Sans Khmer"', '"Khmer OS"', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
      colors: {
        // Khmer AI brand palette
        primary: {
          50:  '#f0eeff',
          100: '#e4e0ff',
          200: '#cdc4ff',
          300: '#b09aff',
          400: '#9080ff',
          500: '#7c6af7',  // main accent
          600: '#6a54e0',
          700: '#5a40c4',
          800: '#4a35a0',
          900: '#3c2b80',
        },
        // Background shades (dark theme)
        surface: {
          900: '#0f0f1a',  // bg-primary
          800: '#1a1a2e',  // bg-secondary
          700: '#16213e',  // bg-tertiary
          600: '#1e1e30',  // bg-card
          500: '#252540',  // bg-hover
          400: '#2a2a50',  // bg-active
        },
        border: {
          DEFAULT: '#2a2a45',
          hover:   '#404070',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        accent: '0 4px 20px rgba(124, 106, 247, 0.3)',
        card:   '0 4px 12px rgba(0,0,0,0.5)',
      },
      animation: {
        'spin-fast': 'spin 0.7s linear infinite',
        'fade-in':   'fadeIn 0.15s ease',
        'slide-up':  'slideUp 0.2s ease',
        'toast-in':  'toastIn 0.2s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },              to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        toastIn: { from: { opacity: 0, transform: 'translateX(30px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
