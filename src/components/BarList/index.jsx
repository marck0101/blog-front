/**
 * Ranking em barras horizontais (uma série, uma cor): rótulo, barra
 * proporcional ao maior valor e o número em texto, então a lista já é a
 * própria tabela. Passar o mouse mostra o detalhe.
 *
 * items: [{ key, label, value, detail?, href? }]
 */
export default function BarList({ items, formatValue = (v) => v.toLocaleString("pt-BR"), empty = "Sem dados no período." }) {
  if (!items?.length) return <p className="text-sm text-gray-400 py-2">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.key} className="group" title={item.detail || `${item.label}: ${formatValue(item.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="truncate text-gray-700 dark:text-gray-200 hover:underline"
              >
                {item.label}
              </a>
            ) : (
              <span className="truncate text-gray-700 dark:text-gray-200">{item.label}</span>
            )}
            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 group-hover:bg-blue-700 dark:group-hover:bg-blue-400 transition-colors"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
          {item.detail && (
            <p className="hidden group-hover:block text-xs text-gray-500 dark:text-gray-300 mt-0.5">{item.detail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
