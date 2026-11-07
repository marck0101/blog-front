// Tema antes de pintar qualquer coisa (mesma regra de src/utils/theme.js): o
// HTML pré-renderizado do post já aparece no tema escuro, sem piscar claro.
// Arquivo separado, não inline: a CSP só libera script do próprio site (SEC-02).
(function () {
  var t = "system";
  try {
    t = localStorage.getItem("theme") || "system";
  } catch {
    /* sem localStorage: segue o tema do sistema */
  }
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.classList.toggle("dark", t === "dark");
  document.documentElement.style.colorScheme = t;
})();
