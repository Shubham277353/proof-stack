/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef1f7',
          100: '#d5dced',
          200: '#aab8db',
          300: '#7f94c9',
          400: '#5470b7',
          500: '#3a56a5',
          600: '#2e4484',
          700: '#1e2f5e',
          800: '#141f3f',
          900: '#0c1428',
          950: '#070d1a',
        },
        ivory: {
          50:  '#fdfcf8',
          100: '#faf7f0',
          200: '#f4ede0',
          300: '#ecddd0',
        },
        amber: {
          accent: '#d97706',
          light:  '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
