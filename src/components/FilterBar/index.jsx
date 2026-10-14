import { lazy, Suspense, useEffect, useState } from "react";

// react-datepicker + date-fns só são baixados quando o date range é exibido (admin).
const DateRangePicker = lazy(() => import("../DateRangePicker"));

/**
 * FilterBar — busca com debounce + date range opcional.
 * Props:
 *   onSearch(value)         — chamado após 400ms de pausa na digitação
 *   showDateRange           — exibe o date range picker (default true)
 *   dateFrom / dateTo       — strings "YYYY-MM-DD" controladas pelo pai
 *   onDateFromChange(val)
 *   onDateToChange(val)
 *   onClear()               — callback para limpar filtros externos
 *   searchPlaceholder
 *   searchValue             — termo vindo de fora (ex.: ?q= da URL); sincroniza o campo
 *   hasActiveFilters        — false esconde "Limpar filtros" (aparece se houver texto digitado)
 */
export default function FilterBar({
  onSearch,
  showDateRange = true,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
  onClear,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  hasActiveFilters = true,
}) {
  const [inputValue, setInputValue] = useState(searchValue);

  // Termo mudou por fora (voltar do navegador, link sem ?q=): atualiza o campo.
  // Ignora a diferença de espaços enquanto a pessoa digita.
  const [syncedValue, setSyncedValue] = useState(searchValue);
  if (searchValue !== syncedValue) {
    setSyncedValue(searchValue);
    if (searchValue !== inputValue.trim()) setInputValue(searchValue);
  }

  // Debounce interno de 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(inputValue.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setInputValue("");
    onSearch?.("");
    onDateFromChange?.("");
    onDateToChange?.("");
    onClear?.();
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input name="search"
        type="text"
        placeholder={searchPlaceholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="input py-1.5 text-sm flex-1 min-w-[180px]"
      />

      {showDateRange && (
        <Suspense fallback={null}>
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={(from, to) => {
            onDateFromChange?.(from);
            onDateToChange?.(to);
          }}
        />
        </Suspense>
      )}

      {(hasActiveFilters || inputValue.trim()) && (
      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 underline whitespace-nowrap"
      >
        Limpar filtros
      </button>
      )}
    </div>
  );
}
