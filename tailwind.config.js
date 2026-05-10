/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        mist: '#f5f7f5',
        pine: '#355145',
        clay: '#d8cab6',
        sky: '#dbe9f1'
      }
    }
  },
  plugins: []
};
