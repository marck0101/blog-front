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

// ===== Automações e Placar (marca: tinta, nota e tijolo; sem semáforo) =====

// Destaque por tinta (normal), nota (apagado) e tijolo (precisa de atenção)
export const INK = "text-gray-900 dark:text-gray-100";
export const NOTE = "text-gray-500 dark:text-gray-400";
export const BRICK = "text-[#9a3b26] dark:text-[#e59a85]";

export const AUTOMACAO_STATUS = {
  ok: { label: "OK", symbol: "✓", tone: INK },
  rodando: { label: "Rodando", symbol: "…", tone: NOTE },
  atrasada: { label: "Atrasada", symbol: "▲", tone: BRICK },
  falhou: { label: "Falhou", symbol: "✕", tone: BRICK },
  nunca_rodou: { label: "Nunca rodou", symbol: "–", tone: NOTE },
};

export const PLACAR_STATUS = {
  abaixo: { label: "Abaixo da meta", symbol: "▼", tone: BRICK },
  na_meta: { label: "Na meta", symbol: "=", tone: INK },
  acima: { label: "Acima da meta", symbol: "▲", tone: INK },
  sem_meta: { label: "Sem meta", symbol: "–", tone: NOTE },
  sem_dados: { label: "Sem dado", symbol: "–", tone: NOTE },
};

/** 1500 -> "1,5 s"; 90000 -> "1 min 30 s"; sem valor: "—" */
export function duration(ms) {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
  const m = Math.floor(s / 60);
  const rest = Math.round(s % 60);
  return rest ? `${m} min ${rest} s` : `${m} min`;
}

/** "2026-W48" + início "2026-11-23" -> "23/11" */
export const dayMonth = (key) => (key ? `${key.slice(8, 10)}/${key.slice(5, 7)}` : "");

/** Valor do placar: reais para receita, número para o resto */
export const placarValue = (value, unit) => (unit === "brl" ? brl(value) : num(value));
