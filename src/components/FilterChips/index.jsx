function chip(active) {
  return (
    "px-3 py-1.5 rounded-full border text-sm font-medium transition select-none whitespace-nowrap " +
    (active
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500")
  );
}

function chipSelectAll(active) {
  return (
    "px-3 py-1.5 rounded-full border text-sm font-medium transition select-none whitespace-nowrap " +
    (active
      ? "bg-blue-800 text-white border-blue-800 ring-2 ring-blue-300 dark:ring-blue-500"
      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500")
  );
}

/**
 * FilterChips — grupo de chips clicáveis.
 *
 * multiSelect=true  → selected é array de slugs (categorias)
 * multiSelect=false → selected é string (status)
 */
export default function FilterChips({
  options = [],
  selected = [],
  onChange,
  allLabel = "Todas",
  multiSelect = true,
  showAll = true,
  showSelectAll = false,
  selectAllLabel = "Selecionar todas",
}) {
  const isAll = multiSelect
    ? selected.length === 0
    : !selected || selected === "all";

  const isAllSelected =
    multiSelect && options.length > 0 && selected.length === options.length;

  const allValues = options.map((o) => o.slug ?? o.value);

  const toggle = (val) => {
    if (multiSelect) {
      onChange(
        selected.includes(val)
          ? selected.filter((s) => s !== val)
          : [...selected, val]
      );
    } else {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {showAll && (
        <button
          type="button"
          className={chip(isAll)}
          onClick={() => onChange(multiSelect ? [] : "all")}
        >
          {allLabel}
        </button>
      )}

      {multiSelect && showSelectAll && options.length > 0 && (
        <button
          type="button"
          className={chipSelectAll(isAllSelected)}
          onClick={() => onChange(isAllSelected ? [] : allValues)}
        >
          {selectAllLabel}
        </button>
      )}

      {options.map((opt) => {
        const val = opt.slug ?? opt.value;
        const active = multiSelect ? selected.includes(val) : selected === val;
        return (
          <button
            key={val}
            type="button"
            className={chip(active)}
            onClick={() => toggle(val)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
