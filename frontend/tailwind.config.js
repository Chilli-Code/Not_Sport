/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1C1C1B",
        secondary:"#272727",
        third : "#181817",
        textPrimary : "#B5B5B5",
        textSecondary : "#FDFDFD",
        bgPrimary: "#FF9E01",
        bgSecondary : "#F77801",
        heroSecondary: "#FF9E01",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
