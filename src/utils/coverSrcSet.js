// Sem dependências do Vite: usado também por api/prerender.js (preload da capa)

// Capas enviadas pelo painel (covers/<timestamp>.webp) têm versões de 480 e
// 800px ao lado da principal de até 1200px (backend: services/coverImage.service.js)
const COVER_RE = /^https:\/\/storage\.googleapis\.com\/.+\/covers\/\d+\.webp$/;

export function coverSrcSet(url) {
  if (!url || !COVER_RE.test(url)) return undefined;
  const base = url.replace(/\.webp$/, "");
  return `${base}-480w.webp 480w, ${base}-800w.webp 800w, ${url} 1200w`;
}

// Largura exibida da capa na grade (3 colunas em max-w-5xl, 2 no tablet, 1 no celular)
export const GRID_SIZES = "(min-width: 768px) 310px, (min-width: 640px) 50vw, 100vw";
