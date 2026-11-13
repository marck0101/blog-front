import { Check } from "lucide-react";
import { statusOf } from "../utils/readingHistory";

// Selo do cartão: "✓ Lido" ou "42% lido" (nada se o leitor não abriu o post)
export function ReadChip({ entry, className = "" }) {
  const status = statusOf(entry);
  if (!status) return null;
  if (status === "lido") {
    return (
      <span className={`skin-readchip inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 ${className}`}>
        <Check size={12} className="shrink-0" aria-hidden="true" /> Lido
      </span>
    );
  }
  return (
    <span className={`skin-readchip inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-medium tabular-nums bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 ${className}`}>
      {entry.max}% lido
    </span>
  );
}

// Barra fina na base da capa com quanto já leu (decorativa: o selo diz o mesmo)
export function ReadBar({ entry }) {
  const status = statusOf(entry);
  if (!status) return null;
  const pct = status === "lido" ? 100 : entry.max;
  return (
    <div aria-hidden="true" className="skin-readbar absolute inset-x-0 bottom-0 h-1 bg-black/20">
      <div
        className={`h-full ${status === "lido" ? "bg-green-600" : "bg-blue-600 dark:bg-blue-400"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
