import { useEffect, useState } from "react";

/**
 * FilterBar — busca com debounce + date range opcional.
 * Props:
 *   onSearch(value)         — chamado após 400ms de pausa na digitação
 *   showDateRange           — exibe os inputs de data (default true)
 *   dateFrom / dateTo       — strings "YYYY-MM-DD" controladas pelo pai
 *   onDateFromChange(val)
 *   onDateToChange(val)
 *   onClear()               — callback para limpar filtros externos
 *   searchPlaceholder
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
}) {
  const [inputValue, setInputValue] = useState("");

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
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="input py-1.5 text-sm flex-1 min-w-[180px]"
      />

      {showDateRange && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className="input py-1.5 text-sm"
          />
          <span className="text-xs text-gray-400">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="input py-1.5 text-sm"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 underline whitespace-nowrap"
      >
        Limpar filtros
      </button>
    </div>
  );
}
