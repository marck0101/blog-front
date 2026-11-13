// Modo raiz: visual retrô do blog, liga/desliga, independente do tema. Claro +
// raiz = Jornal; escuro + raiz = Terminal (o CSS escolhe pela classe "dark").
// Mesma regra de public/theme-init.js, que aplica antes de pintar.
const KEY = "skin";
export const SKIN_CSS_ID = "skin-raiz";
export const SKIN_CSS_HREF = "/skins/raiz.css";

export function getSkinPref() {
  try {
    return localStorage.getItem(KEY) === "raiz";
  } catch {
    return false;
  }
}

// O CSS só é baixado por quem liga; quem nunca liga não paga nada
export function loadSkinCss() {
  if (document.getElementById(SKIN_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = SKIN_CSS_ID;
  link.rel = "stylesheet";
  link.href = SKIN_CSS_HREF;
  document.head.appendChild(link);
}

export function applySkin(on = getSkinPref()) {
  if (on) loadSkinCss();
  document.documentElement.classList.toggle("raiz", on);
  return on;
}

export function setSkinPref(on) {
  try {
    if (on) localStorage.setItem(KEY, "raiz");
    else localStorage.removeItem(KEY);
  } catch {
    /* sem localStorage: vale só nesta visita */
  }
  return applySkin(on);
}
