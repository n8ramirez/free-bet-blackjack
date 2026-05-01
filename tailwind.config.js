/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: 'var(--felt)',
          light:   'var(--felt-light)',
          dark:    'var(--felt-dark)',
          border:  'var(--felt-border)',
        },
      },
      fontFamily: {
        game: ['Georgia', 'Times New Roman', 'serif'],
      },
      keyframes: {
        cardFlipIn: {
          '0%':   { opacity: '0.5', transform: 'perspective(400px) rotateY(90deg)' },
          '100%': { opacity: '1',   transform: 'perspective(400px) rotateY(0deg)'  },
        },
        spinBorder: {
          '0%':   { transform: 'rotate(0deg)'   },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'card-in':     'cardFlipIn 0.375s ease-out forwards',
        'card-flip':   'cardFlipIn 0.3125s ease-out forwards',
        'spin-border': 'spinBorder 1.45s linear infinite',
      },
      boxShadow: {
        card: '2px 4px 10px rgba(0,0,0,0.6)',
        'card-active': '0 0 0 3px #f59e0b, 2px 4px 10px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
