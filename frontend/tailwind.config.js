/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bbddfc',
          300: '#7cc0fa',
          400: '#389df6',
          500: '#0e80e5',
          600: '#0263be',
          700: '#034f99',
          800: '#07447e',
          900: '#0c3a69',
          950: '#082545',
        }
      }
    },
  },
  plugins: [],
}
