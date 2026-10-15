import { useSyncExternalStore } from "react";
import PostsService from "../services/posts.service";
import { trackEvent } from "./analytics";

// Posts salvos pelo leitor, só neste navegador (localStorage). Guarda o
// necessário para listar em /salvos sem chamar a API:
// [{ id, slug, title, excerpt, category, coverImage, publishedAt, savedAt }]
const KEY = "favorite-posts";
const EVENT = "favorite-posts-change";
const EMPTY = [];

let cachedRaw = null;
let cachedValue = EMPTY;

function readAll() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* sem localStorage: nada salvo */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : EMPTY;
      cachedValue = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

const snapshot = (post) => ({
  id: post.id || post._id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt || "",
  category: post.category,
  coverImage: post.coverImage || null,
  publishedAt: post.publishedAt || post.createdAt,
  savedAt: new Date().toISOString(),
});

export const isFavorite = (list, slug) => list.some((p) => p.slug === slug);

/**
 * Salva ou remove. A contagem no servidor é anônima (só +1/-1 no post) e o
 * evento vai para o GA4. Devolve o novo estado (true = salvo).
 */
export function toggleFavorite(post, location = "post") {
  const list = readAll();
  const saved = isFavorite(list, post.slug);
  const next = saved ? list.filter((p) => p.slug !== post.slug) : [snapshot(post), ...list];
  if (!writeAll(next)) return saved;

  const id = post.id || post._id;
  PostsService.engage(id, saved ? "unfavorite" : "favorite");
  trackEvent(saved ? "favorite_remove" : "favorite_add", {
    post_slug: post.slug,
    post_category: post.category,
    link_location: location,
  });
  return !saved;
}

function subscribe(callback) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback); // outra aba
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Lista de salvos (mais recentes primeiro); atualiza sozinha
export function useFavorites() {
  return useSyncExternalStore(subscribe, readAll, () => EMPTY);
}
