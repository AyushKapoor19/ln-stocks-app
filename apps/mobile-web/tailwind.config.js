/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          light: '#22c55e',
          dark: '#15803d',
        },
        background: {
          DEFAULT: '#000000',
          card: '#111111',
          input: '#1a1a1a',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          tertiary: '#737373',
        },
        error: '#ef4444',
        success: '#22c55e',
      },
      animation: {
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

