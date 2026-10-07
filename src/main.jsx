import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./styles/global.css";
import { AuthProvider } from "./context/AuthContext";

// Metadados injetados pelo servidor (index.html / api/prerender.js) servem para
// crawlers sem JS; no navegador o React 19 assume o <head> — remove para não duplicar.
document.querySelectorAll("[data-prerender]").forEach((el) => el.remove());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
