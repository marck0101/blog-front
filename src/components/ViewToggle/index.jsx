import { LayoutGrid, LayoutList, List } from "lucide-react";

const VIEW_OPTIONS = {
  grid: { label: "Grade", icon: LayoutGrid },
  list: { label: "Lista", icon: LayoutList },
  compact: { label: "Compacta", icon: List },
};

/**
 * Seletor de formato (grade, lista, compacta): botões de ícone num grupo,
 * com rótulo para leitor de tela e dica ao passar o mouse.
 */
export default function ViewToggle({ value, onChange, modes = ["grid", "list", "compact"], className = "" }) {
  return (
    <div
      role="group"
      aria-label="Formato de visualização"
      className={`inline-flex shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-0.5 ${className}`}
    >
      {modes.map((mode) => {
        const { label, icon: Icon } = VIEW_OPTIONS[mode];
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`p-2 rounded-md transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
