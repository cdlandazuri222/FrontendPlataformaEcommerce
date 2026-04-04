/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "brand-blue": "#0a3d82",
        "brand-blue-light": "#1557b0",
        "brand-red": "#d32f2f",
        "soft-gray": "#f8fafc",
        "border-color": "#e2e8f0",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.75rem",
        xl: "1.25rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
