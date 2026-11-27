// Regras e textos dos Experimentos do Cockpit (sem dependência de tela).
// A API é quem manda: aqui só se espelha o mapa de status para mostrar os botões certos.

const DAY = 24 * 60 * 60 * 1000;

export const AREAS = {
  conteudo: "Conteúdo",
  prospeccao: "Prospecção",
  email: "E-mail",
  site: "Site",
  anuncio: "Anúncio",
  oferta: "Oferta",
};

export const DECISIONS = { adotar: "Adotar", descartar: "Descartar", repetir: "Repetir" };

// Colunas na ordem do fluxo; símbolo + texto (nunca só cor)
export const STATUSES = [
  { key: "ideia", label: "Ideia", symbol: "○" },
  { key: "planejado", label: "Planejado", symbol: "◔" },
  { key: "rodando", label: "Rodando", symbol: "▶" },
  { key: "analisando", label: "Analisando", symbol: "◑" },
  { key: "concluido", label: "Concluído", symbol: "✓" },
  { key: "descartado", label: "Descartado", symbol: "✕" },
];

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));

// Mesmo mapa da API (app/config/cockpitExperiments.js)
export const TRANSITIONS = {
  ideia: ["planejado", "descartado"],
  planejado: ["ideia", "rodando", "descartado"],
  rodando: ["planejado", "analisando", "descartado"],
  analisando: ["rodando", "concluido", "descartado"],
  concluido: ["analisando"],
  descartado: ["ideia"],
};

/** Texto do botão que leva ao status `to` */
export const MOVE_LABEL = {
  ideia: "Voltar para ideia",
  planejado: "Planejar",
  rodando: "Rodar",
  analisando: "Analisar",
  concluido: "Concluir",
  descartado: "Descartar",
};

/** impacto × confiança × facilidade (1 a 125); incompleto: 0 */
export function iceScore(ice) {
  const { impact, confidence, ease } = ice || {};
  return [impact, confidence, ease].every((n) => Number.isInteger(n) && n >= 1 && n <= 5) ? impact * confidence * ease : 0;
}

/** Maior ICE primeiro; empate: mais novo primeiro */
export function sortByIce(list) {
  return [...list].sort((a, b) => (b.iceScore || 0) - (a.iceScore || 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** Dias inteiros até a data prevista (negativo: já passou). Sem data: null. */
export function daysLeft(plannedEnd, now = Date.now()) {
  if (!plannedEnd) return null;
  return Math.ceil((new Date(plannedEnd).getTime() - now) / DAY);
}

export function daysLeftText(plannedEnd, now = Date.now()) {
  const d = daysLeft(plannedEnd, now);
  if (d === null) return "sem data prevista";
  if (d > 1) return `faltam ${d} dias`;
  if (d === 1) return "falta 1 dia";
  if (d === 0) return "termina hoje";
  return d === -1 ? "passou 1 dia do prazo" : `passaram ${-d} dias do prazo`;
}

/** A hipótese precisa de "Se … então … porque …" (a API confere também) */
export const HYPOTHESIS_RE = /\bse\b[\s\S]+\bent[aã]o\b[\s\S]+\bporque\b[\s\S]+/i;

/** Só https com endereço; o mesmo critério da API, para avisar antes de enviar */
export function isHttpsUrl(value) {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "https:" && Boolean(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}

export const LINK_GROUPS = [
  { key: "anuncios", label: "Anúncios" },
  { key: "analytics", label: "Analytics" },
  { key: "sistemas", label: "Sistemas" },
  { key: "documentos", label: "Documentos" },
  { key: "clientes", label: "Clientes" },
  { key: "outros", label: "Outros" },
];
