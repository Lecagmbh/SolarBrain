/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slatebg: "#020617",
      },
      boxShadow: {
        deep: "0 18px 40px rgba(15,23,42,.7)",
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
  plugins: [],
};
