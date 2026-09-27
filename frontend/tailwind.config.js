/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A1428',
          800: '#132240',
          700: '#1C315E',
        },
        trek: {
          blue: '#1E5AA8',
          lightBlue: '#3B82F6',
          gold: '#C9A24B',
          goldHover: '#B08B39',
          bg: '#F5F7FA',
          card: '#FFFFFF',
          darkCard: '#132240',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
