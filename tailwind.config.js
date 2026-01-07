import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ✅ A ÚNICA COISA OBRIGATÓRIA

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: "#374151", // gray-700
          },
        },
        dark: {
          css: {
            color: "#e5e7eb", // gray-200
            h1: { color: "#f9fafb" },
            h2: { color: "#f9fafb" },
            h3: { color: "#f9fafb" },
            strong: { color: "#f9fafb" },
            a: { color: "#93c5fd" },
            blockquote: {
              borderLeftColor: "#374151",
              color: "#d1d5db",
            },
          },
        },
      },
    },
  },

  plugins: [typography],
};


// module.exports = {
//   content: ["./index.html", "./src/**/*.{js,jsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [
//     require("@tailwindcss/typography"),
//   ],
// };
