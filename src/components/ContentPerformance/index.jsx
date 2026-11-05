import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Minus, Search } from "lucide-react";
import FilterChips from "../FilterChips";
import Sparkline from "../Sparkline";
import MetricsService from "../../services/metrics.service";
import SubscriberService from "../../services/subscriber.service";
import PostsService from "../../services/posts.service";
import SortableTh from "../SortableTh";
import useSortPreference from "../../hooks/useSortPreference";

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
];

const METRICS = [
  { value: "views", label: "Leituras" },
  { value: "favorites", label: "Favoritos" },
  { value: "shares", label: "Compartilhamentos" },
  { value: "shareVisits", label: "Visitas por compartilhamento" },
];

// Ordem: escolhida clicando nos cabeçalhos da tabela
const SORTS = ["total", "low", "up", "down", "peak", "peak_low", "recent", "oldest"].map((value) => ({ value }));

// Linhas visíveis por vez (a maioria dos posts antigos fica em zero no período)
const PAGE = 15;

const selectClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

const fmtDay = (key) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

// Variação contra o período anterior: null quando não dá para comparar
function change(m, isNew) {
  if (isNew) return { kind: "new" };
  if (m.previous === 0) return m.total === 0 ? { kind: "none" } : { kind: "fromZero" };
  const pct = ((m.total - m.previous) / m.previous) * 100;
  return { kind: Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down", pct };
}

function Delta({ value }) {
  if (value.kind === "new") {
    return <span className="text-xs text-gray-500 dark:text-gray-300" title="Publicado durante o período anterior: comparação não é justa">Novo</span>;
  }
  if (value.kind === "fromZero") {
    return <span className="text-xs text-gray-500 dark:text-gray-300" title="Período anterior sem registros: não dá para calcular a variação">sem base</span>;
  }
  if (value.kind === "none") return <span className="text-xs text-gray-400">—</span>;
  if (value.kind === "flat") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
        <Minus size={12} aria-hidden="true" /> estável
      </span>
    );
  }
  const up = value.kind === "up";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
      <Icon size={12} aria-hidden="true" />
      <span className="sr-only">{up ? "alta de" : "queda de"} </span>
      {Math.abs(value.pct).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
    </span>
  );
}

function peakOf(series, dayKeys) {
  let best = null;
  series.forEach((v, i) => {
    if (v !== null && v > 0 && (!best || v >= best.value)) best = { value: v, day: dayKeys[i] };
  });
  return best;
}

// Dias do post em tabela: o mesmo dado da sparkline, legível sem hover
function DaysTable({ series, dayKeys, metricLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs tabular-nums">
        <caption className="sr-only">{metricLabel} por dia</caption>
        <tbody>
          <tr>
            <th scope="row" className="pr-3 py-1 text-left font-medium text-gray-500 dark:text-gray-300">Dia</th>
            {dayKeys.map((d) => (
              <td key={d} className="px-1.5 py-1 text-center text-gray-500 dark:text-gray-300">{fmtDay(d)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="pr-3 py-1 text-left font-medium text-gray-500 dark:text-gray-300">{metricLabel}</th>
            {series.map((v, i) => (
              <td key={dayKeys[i]} className={`px-1.5 py-1 text-center ${v ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>
                {v === null ? "·" : v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Desempenho por conteúdo: uma linha por post publicado, com a sparkline diária
 * da métrica escolhida, o total do período, a variação contra o período anterior
 * e o dia de pico.
 */
export default function ContentPerformance() {
  const [days, setDays] = useState("30");
  const [metric, setMetric] = useState("views");
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("");
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useSortPreference("admin-content-sort", SORTS, "total");
  const [sharedScale, setSharedScale] = useState(false);
  const [open, setOpen] = useState(null);
  const [visible, setVisible] = useState(PAGE);

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
    PostsService.getSeasons().then(setSeasons).catch(() => {});
  }, []);

  // Busca espera o usuário parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setSearch(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    let active = true;
    MetricsService.content({ days: Number(days), category, season, search })
      .then((d) => active && (setData(d), setError(false), setVisible(PAGE)))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [days, category, season, search]);

  const metricLabel = METRICS.find((m) => m.value === metric).label;

  const rows = useMemo(() => {
    if (!data) return [];
    const list = data.posts.map((p) => {
      const m = p.metrics[metric];
      return { ...p, m, delta: change(m, p.newInPeriod), peak: peakOf(m.series, data.dayKeys) };
    });
    // Variação em %: sair do zero conta como a maior alta possível
    const pct = (r) => r.delta.pct ?? (r.delta.kind === "fromZero" ? Infinity : 0);
    const byTotal = (a, b) => b.m.total - a.m.total;
    const sorters = {
      total: byTotal,
      low: (a, b) => a.m.total - b.m.total,
      up: (a, b) => pct(b) - pct(a) || byTotal(a, b),
      down: (a, b) => pct(a) - pct(b) || byTotal(a, b),
      recent: (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
      oldest: (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt),
      peak: (a, b) => (b.peak?.value || 0) - (a.peak?.value || 0) || byTotal(a, b),
      peak_low: (a, b) => (a.peak?.value || 0) - (b.peak?.value || 0) || byTotal(a, b),
    };
    if (sort === "up" || sort === "down") {
      // Posts novos não têm base de comparação: vão para o fim, pelo total
      const isNew = (r) => r.delta.kind === "new";
      return [...list.filter((r) => !isNew(r)).sort(sorters[sort]), ...list.filter(isNew).sort(byTotal)];
    }
    return list.sort(sorters[sort] || byTotal);
  }, [data, metric, sort]);

  const sharedMax = useMemo(
    () => Math.max(1, ...rows.flatMap((r) => r.m.series.filter((v) => v !== null))),
    [rows]
  );

  const totals = useMemo(() => {
    const current = rows.reduce((n, r) => n + r.m.total, 0);
    const previous = rows.reduce((n, r) => n + r.m.previous, 0);
    const zero = rows.filter((r) => r.m.total === 0).length;
    return { current, previous, zero };
  }, [rows]);

  const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.label || slug;
  const seasonLabel = (slug) => seasons.find((s) => s.slug === slug)?.label || slug;

  return (
    <section className="space-y-4" aria-labelledby="content-performance">
      <div>
        <h2 id="content-performance" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Desempenho por conteúdo</h2>
        <p className="text-xs text-gray-500 dark:text-gray-300">
          Cada post publicado dia a dia, comparado com o período anterior de mesmo tamanho. Leituras contam a abertura do
          post (navegador do autor fica de fora).
        </p>
      </div>

      {/* Filtros numa linha só, acima da tabela */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChips options={PERIODS} selected={days} onChange={setDays} multiSelect={false} showAll={false} />
        <label className="sr-only" htmlFor="cp-metric">Métrica</label>
        <select id="cp-metric" className={selectClass} value={metric} onChange={(e) => setMetric(e.target.value)}>
          {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="cp-category">Categoria</label>
        <select id="cp-category" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        {seasons.length > 0 && (
          <>
            <label className="sr-only" htmlFor="cp-season">Season</label>
            <select id="cp-season" className={selectClass} value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">Todas as seasons</option>
              {seasons.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
          </>
        )}
        <div className="relative flex-1 min-w-[12rem]">
          <label className="sr-only" htmlFor="cp-search">Buscar post</label>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input id="cp-search" className="input !pl-9" placeholder="Buscar post..." value={term} onChange={(e) => setTerm(e.target.value)} autoComplete="off" />
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {data ? (
              <>
                <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{totals.current.toLocaleString("pt-BR")}</span>{" "}
                {metricLabel.toLowerCase()} em {rows.length} post(s)
                {totals.previous > 0 && <> · período anterior {totals.previous.toLocaleString("pt-BR")}</>}
                {totals.zero > 0 && <> · {totals.zero} sem registro no período</>}
              </>
            ) : (
              "Carregando..."
            )}
          </p>
          <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={sharedScale} onChange={(e) => setSharedScale(e.target.checked)} className="rounded" />
            Mesma escala para todos
            <span className="text-gray-400">({sharedScale ? "compara tamanho" : "mostra o formato de cada post"})</span>
          </label>
        </div>

        {error && <p className="px-5 py-6 text-sm text-red-600">Erro ao carregar o desempenho dos posts.</p>}
        {data && !error && rows.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-500 dark:text-gray-300">Nenhum post publicado com esses filtros.</p>
        )}

        {rows.length > 0 && (
          // relative: textos sr-only (absolute) das células ficam presos na rolagem da tabela
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                  <SortableTh label="Post" asc="oldest" desc="recent" sort={sort} onSort={setSort} className="px-5 py-2" title="Data de publicação" />
                  <th className="px-3 py-2 font-semibold">Dia a dia</th>
                  <SortableTh label="Total" asc="low" desc="total" sort={sort} onSort={setSort} align="right" className="px-3 py-2" />
                  <SortableTh label="vs anterior" asc="down" desc="up" sort={sort} onSort={setSort} align="right" className="px-3 py-2" title="Variação contra o período anterior" />
                  <SortableTh label="Pico" asc="peak_low" desc="peak" sort={sort} onSort={setSort} align="right" className="px-3 py-2" title="Dia com mais no período" />
                  <th className="px-3 py-2"><span className="sr-only">Detalhes</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, visible).map((r) => {
                  const isOpen = open === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-t border-gray-100 dark:border-gray-800 align-middle">
                        <td className="px-5 py-2 min-w-[14rem]">
                          <a href={`/blog/${r.slug}`} target="_blank" rel="noreferrer" className="text-gray-900 dark:text-gray-100 hover:underline line-clamp-2">
                            {r.title}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {new Date(r.publishedAt).toLocaleDateString("pt-BR")} · {categoryLabel(r.category)}
                            {r.season && <> · {seasonLabel(r.season)}</>}
                          </p>
                        </td>
                        <td className="px-3 py-2 w-44 min-w-[9rem]">
                          <Sparkline
                            series={r.m.series}
                            dayKeys={data.dayKeys}
                            max={sharedScale ? sharedMax : undefined}
                            label={`${metricLabel} de ${r.title}`}
                          />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                          {r.m.total.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <Delta value={r.delta} />
                          {r.delta.kind !== "new" && r.delta.kind !== "none" && (
                            <p className="text-[11px] text-gray-400 tabular-nums">antes {r.m.previous.toLocaleString("pt-BR")}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-600 dark:text-gray-300 tabular-nums whitespace-nowrap">
                          {r.peak ? <>{r.peak.value} em {fmtDay(r.peak.day)}</> : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : r.id)}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Esconder dias" : "Ver dias em tabela"}
                            title={isOpen ? "Esconder dias" : "Ver dias em tabela"}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                          >
                            <ChevronDown size={16} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50 dark:bg-gray-950/40">
                          <td colSpan={6} className="px-5 py-3">
                            <DaysTable series={r.m.series} dayKeys={data.dayKeys} metricLabel={metricLabel} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {rows.length > visible && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE * 2)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Mostrar mais ({rows.length - visible} restante{rows.length - visible === 1 ? "" : "s"})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
