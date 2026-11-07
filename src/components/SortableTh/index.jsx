import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

/**
 * SortableTh — cabeçalho de coluna que ordena a tabela ao clicar.
 * Padrão das tabelas do painel: a ordem fica nos cabeçalhos (sem SortSelect
 * repetindo a mesma função). Guarde a escolha com useSortPreference.
 *
 * Props:
 *   label          — texto da coluna
 *   asc / desc     — chave de ordem crescente (A-Z, menor, mais antigo) e decrescente
 *   first          — "asc" | "desc": direção do 1º clique (a mais útil da coluna)
 *   sort, onSort   — ordem atual da tela e como trocá-la
 *   align          — "left" (padrão) | "right"
 *   className      — padding/largura do <th>, como nos outros cabeçalhos
 *   title          — dica extra (ex.: "Leituras nos últimos 7 dias")
 */
export default function SortableTh({ label, asc, desc, first = "desc", sort, onSort, align = "left", className = "", title }) {
  const direction = sort === asc ? "ascending" : sort === desc ? "descending" : "none";
  const active = direction !== "none";

  const next = () => {
    if (direction === "descending" && asc) return asc;
    if (direction === "ascending" && desc) return desc;
    return first === "asc" ? asc || desc : desc || asc;
  };

  const Icon = direction === "ascending" ? ArrowUp : direction === "descending" ? ArrowDown : ArrowUpDown;
  const hint = direction === "ascending" ? "crescente" : direction === "descending" ? "decrescente" : null;

  return (
    <th scope="col" aria-sort={direction} className={`${className} ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(next())}
        title={title ? `${title} · clique para ordenar` : "Clique para ordenar"}
        className={`group relative inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wide font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:text-gray-900 dark:hover:text-gray-100 ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-gray-900 dark:text-gray-100" : ""}`}
      >
        {label}
        <Icon
          size={12}
          aria-hidden="true"
          className={active ? "text-blue-600 dark:text-blue-400" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"}
        />
        {/* relative no botão: o sr-only (absolute) fica preso aqui e não estica a página */}
        {hint && <span className="sr-only">, ordem {hint}</span>}
      </button>
    </th>
  );
}
