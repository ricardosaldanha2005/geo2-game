/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'team-green': '#16a34a',
        'team-blue': '#3b82f6',
        'team-red': '#dc2626',
      }
    },
  },
  plugins: [],
}
