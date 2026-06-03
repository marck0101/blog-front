const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "";

export function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // URL relativa (upload local antigo): prefixar com base da API
  return `${API_BASE}${url}`;
}
