import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  // vite.config.js
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // npm test: utilitários e componentes, com DOM simulado (jsdom)
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}", "api/**/*.test.js"],
  },
});
