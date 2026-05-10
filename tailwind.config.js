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
        canvas: '#eeefe9',
        card: '#ffffff',
        ink: '#23251d',
        body: '#4d4f46',
        hairline: '#bfc1b7',
        soft: '#e5e7e0',
        primary: '#f7a501',
        'primary-pressed': '#dd9001',
        linkblue: '#1d4ed8',
        teal: '#1078a3',
        redsoft: '#f7d6d3',
        greensoft: '#d9eddf',
        purplesoft: '#e7d8ee',
        mist: '#eeefe9',
        pine: '#23251d',
        clay: '#e5e7e0',
        sky: '#dceaf6'
      }
    }
  },
  plugins: []
};
