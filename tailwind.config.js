/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf8f5',
          100: '#f5f1eb',
          200: '#ebe4d8',
          300: '#dccfbc',
          400: '#c9b9a0',
        },
        'gallery-bg': '#f5f3ef',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.2em',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.04)',
        card: '0 2px 12px rgba(0, 0, 0, 0.03)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
    },
  },
  plugins: [],
}
