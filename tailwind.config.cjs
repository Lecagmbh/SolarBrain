/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "gridnetz-bg": "#020617",
        "gridnetz-bg-soft": "#020617",
        "gridnetz-border": "rgba(51,65,85,.9)",
      },
      boxShadow: {
        "gridnetz-kpi": "0 18px 40px rgba(15,23,42,.7)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
