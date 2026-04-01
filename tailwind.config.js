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
          DEFAULT: '#0a1628',
          light: '#1e3a5f',
          hover: '#254875',
          dark: '#122848',
          mid: '#24508a',
        },
        'gray-cc-50':   '#f7f8fa',
        'gray-cc-100':  '#eef0f4',
        'gray-cc-200':  '#dde1e8',
        'gray-cc-400':  '#8d97a8',
        'gray-cc-500':  '#636e7e',
        'gray-cc-700':  '#2e3a4e',
        'gray-cc-800':  '#1a2332',
        'green-cc':     '#16a34a',
        'green-cc-bg':  '#e8f7ee',
        'orange-cc':    '#d97706',
        'orange-cc-bg': '#fef3e2',
        'blue-cc-bg':   '#eef3ff',
        'blue-cc-sel':  '#dbeafe',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
