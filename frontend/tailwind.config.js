/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        correct: '#22c55e',
        close: '#f59e0b',
        wrong: '#ef4444',
        flags: '#3b82f6',
        map: '#22c55e',
        capitals: '#f97316',
        cities: '#a855f7',
        shapes: '#14b8a6',
      },
    },
  },
  plugins: [],
}
