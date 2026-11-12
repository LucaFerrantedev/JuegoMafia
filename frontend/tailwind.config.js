/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#07090e',
          card: '#0f141c',
          border: '#1f2937',
          neon: '#00ffc8',
          crimson: '#ff3366',
          amber: '#ffb703',
          purple: '#a855f7',
          blue: '#00b4d8'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 200, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 200, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}
