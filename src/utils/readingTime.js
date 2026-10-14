import { stripHtml } from "../seo/site";

// ~200 palavras por minuto, mínimo de 1 minuto (mesma conta do backend)
export function readingMinutes(html) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// "~25 min" para totais; "1 h 10 min" acima de uma hora
export function formatMinutes(min) {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
