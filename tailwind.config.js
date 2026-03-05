/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-panel': '#1e293b',
        'dark-border': '#334155',
        'neon-green': '#10b981',
        'neon-yellow': '#f59e0b',
        'neon-red': '#ef4444',
      },
    },
  },
  plugins: [
    require('tailwindcss-scrollbar'),
  ],
}
