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

  // Estilo de época (mesma regra de src/utils/skin.js). O painel não tem.
  // document.write, não appendChild: só o <link> escrito pelo parser segura a
  // pintura em todo navegador, e a página não pisca no visual atual.
  var skin = null;
  try {
    skin = localStorage.getItem("skin");
  } catch {
    /* sem localStorage: visual atual */
  }
  if (skin === "raiz") skin = "jornal";
  if ((skin === "jornal" || skin === "terminal") && location.pathname.indexOf("/admin") !== 0) {
    document.documentElement.classList.add("raiz", skin);
    document.write('<link id="skin-raiz" rel="stylesheet" href="/skins/raiz.css">');
  }
})();
