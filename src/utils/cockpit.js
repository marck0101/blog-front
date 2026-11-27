// Textos e contas da página Hoje do Cockpit (sem dependência de tela)

const MIN = 60 * 1000;

/** "agora", "há 5 min", "há 3 h", "há 2 d"; sem data: "nunca" */
export function timeAgo(date, now = Date.now()) {
  if (!date) return "nunca";
  const diff = now - new Date(date).getTime();
  if (diff < MIN) return "agora";
  if (diff < 60 * MIN) return `há ${Math.floor(diff / MIN)} min`;
  if (diff < 24 * 60 * MIN) return `há ${Math.floor(diff / (60 * MIN))} h`;
  return `há ${Math.floor(diff / (24 * 60 * MIN))} d`;
}

/** Retrato velho: passou de staleAfterSec (2× o esperado). Sem data com prazo: velho. */
export function isStale(tile, now = Date.now()) {
  if (!tile?.staleAfterSec) return false;
  if (!tile.updatedAt) return true;
  return now - new Date(tile.updatedAt).getTime() > tile.staleAfterSec * 1000;
}

const SOURCES = {
  prospect0101: "prospect0101",
  benchmark0101: "benchmark0101",
  blog: "blog",
  ga4: "GA4",
  gsc: "Search Console",
  reports: "relatórios",
  cockpit: "cockpit",
};

/** "prospect0101 · atualizado há 5 min" (sem retrato: "sem atualização") */
export function sourceLine(tile, now = Date.now()) {
  const name = SOURCES[tile?.source] || tile?.source || "—";
  return tile?.updatedAt ? `${name} · atualizado ${timeAgo(tile.updatedAt, now)}` : `${name} · sem atualização`;
}

export const brl = (n) =>
  typeof n === "number" ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

export const num = (n) => (typeof n === "number" ? n.toLocaleString("pt-BR") : "—");

// Status da receita: texto + símbolo (nunca só cor)
export const PACING_STATUS = {
  no_caminho: { label: "No caminho", symbol: "✓" },
  atencao: { label: "Atenção", symbol: "▲" },
  fora: { label: "Fora do ritmo", symbol: "✕" },
  sem_dados: { label: "Sem dados", symbol: "–" },
};

export const JOB_STATUS = {
  ok: { label: "OK", symbol: "✓" },
  rodando: { label: "Rodando", symbol: "…" },
  atrasada: { label: "Atrasada", symbol: "▲" },
  falhou: { label: "Falhou", symbol: "✕" },
};
