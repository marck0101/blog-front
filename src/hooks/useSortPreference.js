import useViewMode from "./useViewMode";

/**
 * Ordem escolhida numa lista do painel, lembrada no navegador por tela (como
 * o formato de exibição). onChange extra (ex.: voltar para a página 1) é opcional.
 */
export default function useSortPreference(storageKey, options, fallback, onChange) {
  const [sort, setSortRaw] = useViewMode(storageKey, options.map((o) => o.value), fallback ?? options[0].value);
  const setSort = (value) => {
    setSortRaw(value);
    onChange?.(value);
  };
  return [sort, setSort];
}
