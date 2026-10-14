import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./styles/global.css";
import { AuthProvider } from "./context/AuthContext";
import { reloadForNewVersion } from "./utils/lazyPage";
import { applyTheme } from "./utils/theme";

// Tema antes do primeiro render: evita piscar claro em quem usa o escuro
applyTheme();

// Metadados injetados pelo servidor (index.html / api/prerender.js) servem para
// crawlers sem JS; no navegador o React 19 assume o <head> — remove para não duplicar.
document.querySelectorAll("[data-prerender]").forEach((el) => el.remove());

// Arquivo de uma versão anterior (deploy novo com a aba aberta): o Vite avisa
// por este evento; recarrega para pegar a versão atual
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
