import { ChevronLeft, ChevronRight } from "lucide-react";

// Páginas visíveis: primeira, última e vizinhas da atual, com "…" nos saltos
function pageItems(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
}

export default function Pagination({ page, totalPages, onChange, className = "" }) {
  if (!totalPages || totalPages <= 1) return null;

  const btn =
    "min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg border text-sm transition " +
    "border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed";
  const idle = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800";

  return (
    <nav
      aria-label="Paginação"
      className={`flex items-center justify-between gap-3 flex-wrap text-sm text-gray-600 dark:text-gray-300 ${className}`}
    >
      <span>Página {page} de {totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={`${btn} ${idle}`}
        >
          <ChevronLeft size={16} />
        </button>

        {pageItems(page, totalPages).map((p) =>
          typeof p === "string" ? (
            <span key={p} className="px-1 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${btn} ${
                p === page ? "bg-blue-600 border-blue-600 text-white" : idle
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className={`${btn} ${idle}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
