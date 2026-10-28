// Dados que api/prerender.js injeta no HTML (window.__PRERENDERED_DATA__):
//   categories, seasons → em todas as páginas pré-renderizadas
//   home: { posts, total, pinned, highlights } → só em /blog
// Com eles o primeiro render já sai completo: sem esperar a API e sem a página
// "pular" quando as seções chegam (CLS).
const data = typeof window !== "undefined" ? window.__PRERENDERED_DATA__ || {} : {};

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
