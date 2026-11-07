/**
 * Skeletons de carregamento: o formato do conteúdo que vai aparecer, no lugar
 * de "Carregando...". Mesma cor e animação em todo o site; a animação para
 * quando o sistema pede menos movimento (motion-reduce).
 *
 *   <Skeleton className="h-4 w-1/2" />           bloco solto (decorativo)
 *   <Loading label="Carregando posts">...</Loading>  área que avisa o leitor de tela
 *   <SkeletonRows cols={5} rows={6} />          linhas de <tbody>
 *   <SkeletonCards count={4} />                  cards de lista (título + linhas)
 */

// as="span" dentro de <p>/<h2> (onde <div> não é HTML válido); passe "block" ou "inline-block" no className
export function Skeleton({ className = "", rounded = "rounded", style, as: Tag = "div" }) {
  return (
    <Tag
      aria-hidden="true"
      style={style}
      className={`${rounded} bg-gray-200 dark:bg-gray-800 animate-pulse motion-reduce:animate-none ${className}`}
    />
  );
}

/**
 * Área carregando: anuncia uma vez ao leitor de tela (role=status) e esconde
 * os blocos dele. `as` troca a tag (ex.: "li" dentro de <ol>).
 */
export function Loading({ label = "Carregando", children, className = "", as: Tag = "div" }) {
  return (
    <Tag role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </Tag>
  );
}

// Larguras variadas: parece texto de verdade, não uma grade de blocos iguais
const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5"];

/**
 * Linhas de tabela: use dentro do <table>, no lugar do <tbody>. O aviso ao
 * leitor de tela vai dentro da 1ª célula (<tbody> só aceita <tr>).
 */
export function SkeletonRows({ cols, rows = 6, label = "Carregando", cellClassName = "px-4 py-3" }) {
  return (
    <tbody role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-gray-100 dark:border-gray-800">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className={cellClassName}>
              {r === 0 && c === 0 && <span className="sr-only">{label}…</span>}
              <Skeleton className={`h-4 ${WIDTHS[(r + c) % WIDTHS.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Cards de lista (comentários, públicos, lixeira...): borda igual à do card
 * real, avatar/ícone opcional, título e linhas de texto.
 */
export function SkeletonCards({ count = 3, lines = 2, avatar = false, grid = false, label = "Carregando" }) {
  return (
    <Loading label={label} className={grid ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white dark:bg-gray-900 p-4 flex gap-3">
          {avatar && <Skeleton className="w-9 h-9 shrink-0" rounded="rounded-full" />}
          <div className="flex-1 space-y-2.5">
            <Skeleton className={`h-4 ${WIDTHS[i % WIDTHS.length]}`} />
            {Array.from({ length: lines }).map((_, l) => (
              <Skeleton key={l} className={`h-3 ${l === lines - 1 ? "w-1/3" : "w-full"}`} />
            ))}
          </div>
        </div>
      ))}
    </Loading>
  );
}

/**
 * Tela de formulário (editores): link "voltar", título, campos, área grande de
 * texto e, se `sidebar`, a coluna lateral de 320px do editor de post.
 */
export function SkeletonForm({ sidebar = false, label = "Carregando" }) {
  const field = (w, h = "h-10") => (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className={`${h} ${w}`} rounded="rounded-lg" />
    </div>
  );
  return (
    <Loading label={label} className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-7 w-56" />
      </div>
      <div className={sidebar ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start" : "space-y-6"}>
        <div className="space-y-6 min-w-0">
          {field("w-full")}
          {field("w-full", "h-20")}
          {field("w-full", "h-80")}
        </div>
        {sidebar && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" rounded="rounded-lg" />
                {i === 0 && <Skeleton className="h-9 w-full" rounded="rounded-lg" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Loading>
  );
}
