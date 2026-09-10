/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          400: "#5b7cfa",
          500: "#3b5bfd",
          600: "#2c46e0",
          700: "#2237b4",
        },
      },
    },
  },
  plugins: [],
};