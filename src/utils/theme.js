// Tema do site: "light" | "dark" | "system" (segue o prefers-color-scheme).
// Sem nada salvo, segue o sistema.
const KEY = "theme";
const media = () => window.matchMedia?.("(prefers-color-scheme: dark)");

export function getThemePref() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(pref = getThemePref()) {
  if (pref !== "system") return pref;
  return media()?.matches ? "dark" : "light";
}

// Classe "dark" do Tailwind + color-scheme (barras de rolagem e campos nativos)
export function applyTheme(pref = getThemePref()) {
  const theme = resolveTheme(pref);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  return theme;
}

export function setThemePref(pref) {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* sem localStorage: vale só nesta visita */
  }
  return applyTheme(pref);
}

// No modo "sistema", acompanha a troca de tema do sistema operacional
export function watchSystemTheme(onChange) {
  const mq = media();
  if (!mq) return () => {};
  const handler = () => {
    if (getThemePref() === "system") onChange(applyTheme("system"));
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
