const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx,ejs}'],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
