/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c5dcff',
          300: '#99c3ff',
          400: '#649eff',
          500: '#3873f5',
          600: '#2353e8',
          700: '#1b3fca',
          800: '#1c35a3',
          900: '#1a2e7f', // Deep navy university primary
          950: '#121d50',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
