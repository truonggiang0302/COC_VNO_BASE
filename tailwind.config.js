/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CoC Gold
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Stone / Dark background
        stone: {
          750: '#2d2520',
          850: '#1e1a17',
          950: '#0f0d0b',
        },
        // Army Green
        army: {
          400: '#84a857',
          500: '#6b8f3e',
          600: '#557530',
          700: '#3f5a22',
          800: '#2d4018',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'stone-pattern': "url('/stone-bg.svg')",
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-sm': 'bounce 0.6s ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
