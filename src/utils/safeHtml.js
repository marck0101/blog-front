import DOMPurify from "dompurify";

// HTML de post/envio vindo da API: o backend já limpa ao salvar
// (app/utils/sanitizeHtml.js). Aqui é a segunda camada, na hora de exibir —
// cobre conteúdo antigo e versões do histórico gravadas antes da limpeza.
// target="_blank" fica (o DOMPurify tira por padrão); rel noopener vem do backend.
// Campos de formulário saem: um post não pode exibir um "digite sua senha" falso.
const OPTIONS = {
  ADD_ATTR: ["target"],
  FORBID_TAGS: ["style", "form", "input", "textarea", "select", "button", "option"],
};

// O mesmo conteúdo é exibido várias vezes (cada render da página): guarda os últimos
const cache = new Map();
const CACHE_MAX = 20;

export function safeHtml(html) {
  if (!html) return "";
  let clean = cache.get(html);
  if (clean === undefined) {
    clean = DOMPurify.sanitize(html, OPTIONS);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(html, clean);
  }
  return clean;
}
