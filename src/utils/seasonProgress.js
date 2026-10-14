import { useSyncExternalStore } from "react";

// Progresso de leitura das seasons, só neste navegador (localStorage):
// { "<season>": ["<slug lido>", ...] }. Um episódio conta como lido quando a
// pessoa chega a 75% do texto.
const KEY = "season-progress";
const EVENT = "season-progress-change";
const EMPTY = {};

let cachedRaw = null;
let cachedValue = EMPTY;

function readAll() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* sem localStorage: sem progresso */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : EMPTY;
      cachedValue = parsed && typeof parsed === "object" ? parsed : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

export function markEpisodeRead(season, slug) {
  if (!season || !slug) return;
  const all = readAll();
  const read = all[season] || [];
  if (read.includes(slug)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all, [season]: [...read, slug] }));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* sem localStorage: segue sem salvar */
  }
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback); // outra aba
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Mapa season → slugs lidos; atualiza sozinho quando um episódio é marcado
export function useSeasonProgress() {
  return useSyncExternalStore(subscribe, readAll, () => EMPTY);
}

/**
 * Resumo do progresso de uma season, dada a ordem de leitura (slugs).
 * next = primeiro episódio não lido (null quando terminou)
 */
export function seasonStatus(progress, season, episodeSlugs = []) {
  const read = new Set(progress[season] || []);
  const readCount = episodeSlugs.filter((s) => read.has(s)).length;
  return {
    read,
    readCount,
    total: episodeSlugs.length,
    started: readCount > 0,
    done: episodeSlugs.length > 0 && readCount === episodeSlugs.length,
    next: episodeSlugs.find((s) => !read.has(s)) || null,
  };
}
