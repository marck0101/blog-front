import { useId } from "react";
import { ArrowUpDown } from "lucide-react";

/**
 * SortSelect — seletor de ordem padrão das listas do painel.
 * Mesma altura e estilo do campo de busca (.input), ícone de ordenação à
 * esquerda e rótulo acessível. Fica à direita dos filtros, antes do ViewToggle.
 *
 * Props:
 *   options   — [{ value, label }]
 *
 * Só para listas em cards (Posts, Comentários, Públicos, Lixeira). Tabela
 * ordena pelos cabeçalhos (SortableTh), sem seletor repetindo a mesma função.
 *   value / onChange(value)
 *   label     — rótulo para leitor de tela (padrão "Ordenar por")
 *   className — largura/posição extra (padrão: ocupa a linha no celular, auto no desktop)
 */
export default function SortSelect({ options, value, onChange, label = "Ordenar por", className = "" }) {
  const id = useId();
  return (
    <div className={`relative shrink-0 ${className || "w-full sm:w-auto"}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <ArrowUpDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <select
        id={id}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input !pl-9 py-1.5 text-sm sm:!w-auto"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

