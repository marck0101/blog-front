// Dados que api/prerender.js injeta no HTML como blocos JSON
// (<script type="application/json" id="…">, não executáveis — a CSP não libera
// script inline):
//   prerendered-data      → categories, seasons (todas as páginas);
//                           home: { posts, total, pinned, highlights } (só /blog)
//   prerendered-post      → o post de /blog/:slug
//   prerendered-not-found → slug que o prerender já respondeu como 404
// Com eles o primeiro render já sai completo: sem esperar a API e sem a página
// "pular" quando as seções chegam (CLS).

// Formato antigo (window.__PRERENDERED_*): HTML que a CDN ainda guarda por até
// 10 min depois de um deploy. Pode sair depois que o deploy da SEC-02 assentar.
const LEGACY = {
  "prerendered-data": "__PRERENDERED_DATA__",
  "prerendered-post": "__PRERENDERED_POST__",
  "prerendered-not-found": "__PRERENDERED_NOT_FOUND__",
};

// O bloco não muda depois do carregamento: lê e converte uma vez só
const blocks = new Map();

export function readBlock(id) {
  if (typeof document === "undefined") return undefined;
  if (blocks.has(id)) return blocks.get(id);
  let value;
  const el = document.getElementById(id);
  if (el) {
    try {
      value = JSON.parse(el.textContent);
    } catch {
      value = undefined;
    }
  } else {
    value = window[LEGACY[id]];
  }
  blocks.set(id, value);
  return value;
}

const data = readBlock("prerendered-data") || {};

export function prerendered(key) {
  return data[key];
}

// A home pré-renderizada vale só para o primeiro carregamento: voltar para /blog
// depois de navegar busca de novo (lista pode ter mudado, filtro pode ser outro)
let homeUsed = false;

export function prerenderedHome() {
  return homeUsed ? null : data.home || null;
}

export function markHomeUsed() {
  homeUsed = true;
}
