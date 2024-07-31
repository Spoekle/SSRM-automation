const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
      },
      animation: {
        fadeOut: 'fadeOut 2s ease-out forwards',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animated'),
  ],
};
