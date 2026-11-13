import { useSyncExternalStore } from "react";

// Leituras do leitor, só neste navegador (localStorage, sem conta), como os
// favoritos e o progresso das seasons:
// { "<slug>": { slug, id, title, excerpt, category, coverImage, publishedAt,
//   readingMinutes, max, pos, readAt, updatedAt } }
// max = maior parte do texto já lida (0–100); pos = onde parou da última vez
// (para "continuar de onde parou"); readAt = quando passou de READ_PERCENT.
// Mesma régua da barra de leitura do topo (src/utils/headings.js).
const KEY = "reading-history";
const EVENT = "reading-history-change";
const EMPTY = {};

// Lido = passou de 75% do texto (a mesma regra dos episódios das seasons)
export const READ_PERCENT = 75;
// Abaixo disto é só uma olhada, não conta como "lendo"
export const STARTED_PERCENT = 5;
// Guarda os mais recentes: o navegador tem pouco espaço por site
const MAX_ENTRIES = 200;

let cachedRaw = null;
let cachedValue = EMPTY;
let memory = null; // sem localStorage: vale só nesta visita

function readRaw() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}

const clampPct = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export function getHistory() {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : EMPTY;
      cachedValue = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

function writeAll(all) {
  // Corta os mais antigos se passar do limite
  const entries = Object.values(all);
  let next = all;
  if (entries.length > MAX_ENTRIES) {
    const keep = entries.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, MAX_ENTRIES);
    next = Object.fromEntries(keep.map((e) => [e.slug, e]));
  }
  const raw = JSON.stringify(next);
  memory = raw;
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    /* sem localStorage (ou cheio): fica na memória desta visita */
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Guarda até onde o leitor chegou no post (0–100). O máximo nunca diminui;
 * a posição acompanha a última leitura. Leitura curta (< 5%) não cria registro.
 * Devolve o registro salvo (ou null).
 */
export function recordProgress(post, percent) {
  const slug = post?.slug;
  if (!slug) return null;
  const pct = clampPct(percent);
  const all = getHistory();
  const prev = all[slug];
  if (!prev && pct < STARTED_PERCENT) return null;

  const max = Math.max(prev?.max || 0, pct);
  if (prev && prev.max === max && prev.pos === pct) return prev;

  const now = new Date().toISOString();
  const entry = {
    slug,
    id: post.id || post._id || prev?.id || null,
    title: post.title || prev?.title || "",
    excerpt: post.excerpt || prev?.excerpt || "",
    category: post.category || prev?.category || "",
    coverImage: post.coverImage || prev?.coverImage || null,
    publishedAt: post.publishedAt || prev?.publishedAt || null,
    readingMinutes: post.readingMinutes || prev?.readingMinutes || null,
    max,
    pos: pct,
    readAt: prev?.readAt || (max >= READ_PERCENT ? now : null),
    updatedAt: now,
  };
  writeAll({ ...all, [slug]: entry });
  return entry;
}

export function forgetPost(slug) {
  const all = getHistory();
  if (!all[slug]) return;
  const next = { ...all };
  delete next[slug];
  writeAll(next);
}

export function clearHistory() {
  writeAll({});
}

// "lido" | "lendo" | null
export function statusOf(entry) {
  if (!entry) return null;
  if (entry.readAt || entry.max >= READ_PERCENT) return "lido";
  if (entry.max >= STARTED_PERCENT) return "lendo";
  return null;
}

// Listas para a página de leituras e a home, das mais recentes para as antigas
export function splitHistory(all) {
  const entries = Object.values(all).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return {
    reading: entries.filter((e) => statusOf(e) === "lendo"),
    read: entries.filter((e) => statusOf(e) === "lido"),
  };
}

// Vale a pena oferecer "continuar de onde parou"? (no meio do texto)
export const canResume = (entry) => Boolean(entry) && entry.pos >= STARTED_PERCENT && entry.pos < 95;

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback); // outra aba
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Mapa slug → registro; atualiza sozinho quando o leitor avança num post
export const useReadingHistory = () => useSyncExternalStore(subscribe, getHistory, () => EMPTY);
