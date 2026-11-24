import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, ExternalLink, Link2Off, Maximize2, Network, Pencil, Search, Tag, Unlink, X } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import { Skeleton } from "../../components/Skeleton";
import DashboardService from "../../services/dashboard.service";
import SubscriberService from "../../services/subscriber.service";
import { bounds, connectionsOf, createSimulation, filterGraph, neighborsOf, nodeRadius } from "../../utils/graphLayout";

// Cores das categorias: paleta categórica validada (claro e escuro), na ordem fixa
// de /api/categories. A cor segue a categoria, nunca a posição na tela; a
// legenda, o painel do post e a lista dizem o nome (cor nunca sozinha).
const SERIES = [
  ["#2a78d6", "#3987e5"],
  ["#eb6834", "#d95926"],
  ["#1baf7a", "#199e70"],
  ["#eda100", "#c98500"],
  ["#e87ba4", "#d55181"],
  ["#008300", "#0ca30c"],
  ["#6250d6", "#9085e9"],
  ["#e34948", "#e66767"],
];
const OTHER = ["#8a8a85", "#9a9a95"];

const STATUS_LABEL = { published: "Publicado", planned: "Agendado", draft: "Rascunho" };
const REASON_LABEL = {
  missing: "post não existe",
  trash: "post na lixeira",
  unpublished: "post ainda não publicado",
  "old-slug": "endereço antigo (funciona pelo redirecionamento)",
};

const FILTERS = [
  { key: "tags", label: "Tags" },
  { key: "seasons", label: "Seasons" },
  { key: "related", label: "Leituras sugeridas" },
  { key: "drafts", label: "Rascunhos e agendados" },
];

const HEIGHT = 620;
const WARM_TICKS = 120; // assenta o grosso antes do primeiro desenho

// Zoom e posição que mostram todos os nós
function fitView(sim, width) {
  const b = bounds(sim.nodes);
  const k = Math.min(2, Math.max(0.2, Math.min(width / b.width, HEIGHT / b.height)));
  return { k, x: width / 2 - (b.x + b.width / 2) * k, y: HEIGHT / 2 - (b.y + b.height / 2) * k };
}

const useDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

// Categorias da legenda são também o filtro: clique liga/desliga (uma ou várias);
// nenhuma escolhida = todas. A cor de cada uma não muda com o filtro.
function Legend({ categories, color, active, onToggle, onClear }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300" aria-label="Legenda e filtro por tema">
      {categories.map((c) => {
        const on = active.includes(c.slug);
        const faded = active.length > 0 && !on;
        return (
          <li key={c.slug}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c.slug)}
              title={on ? `Tirar ${c.label} do filtro` : `Mostrar ${c.label}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border transition ${
                on
                  ? "border-gray-500 dark:border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              } ${faded ? "opacity-50" : ""}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color(c.slug) }} aria-hidden="true" /> {c.label}
            </button>
          </li>
        );
      })}
      {active.length > 0 && (
        <li>
          <button type="button" onClick={onClear} className="underline">
            Todos os temas
          </button>
        </li>
      )}
      <li className="inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-400" aria-hidden="true" /> Tag
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rotate-45 border-2 border-gray-700 dark:border-gray-200" aria-hidden="true" /> Season
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-500" aria-hidden="true" /> Rascunho/agendado
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="w-5 border-t-2 border-gray-500" aria-hidden="true" /> Link no texto
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="w-5 border-t-2 border-dotted border-gray-500" aria-hidden="true" /> Leitura sugerida
      </li>
      <li className="text-gray-500 dark:text-gray-400">Tamanho = leituras</li>
    </ul>
  );
}

function NodeList({ title, ids, byId, onPick }) {
  if (!ids.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title} ({ids.length})
      </p>
      <ul className="mt-1 space-y-0.5">
        {ids.map((id) => (
          <li key={id}>
            <button type="button" onClick={() => onPick(id)} className="text-left text-sm hover:underline">
              {byId.get(id)?.label || id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Painel do nó escolhido: o que aponta para ele, para onde ele aponta, tags
function DetailPanel({ node, links, byId, categoryLabel, onPick, onClose }) {
  if (!node) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Clique numa bolinha para ver as ligações. Arraste para reorganizar; role para dar zoom.
      </p>
    );
  }
  const c = connectionsOf(node.id, links);
  const tagPosts = node.type !== "post" ? [...neighborsOf(node.id, links)] : [];
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">{node.label}</p>
          {node.type === "post" ? (
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {categoryLabel(node.category)} · {STATUS_LABEL[node.status]} · {node.views} leituras · recebe {node.inbound} ligação(ões)
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {node.type === "tag" ? "Tag" : "Season"} · {node.count} post(s)
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar detalhes" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} />
        </button>
      </div>
      {node.type === "post" && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/posts/${node.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-sm">
            <Pencil size={14} aria-hidden="true" /> Editar
          </Link>
          {node.status === "published" && (
            <a href={`/blog/${node.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-sm">
              <ExternalLink size={14} aria-hidden="true" /> Ver no blog
            </a>
          )}
        </div>
      )}
      {node.type === "post" && node.status === "published" && node.inbound === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 flex gap-1">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" /> Órfão: nenhum outro post publicado aponta para ele.
        </p>
      )}
      <NodeList title="Recebe link de" ids={c.linksIn} byId={byId} onPick={onPick} />
      <NodeList title="Aponta para" ids={c.linksOut} byId={byId} onPick={onPick} />
      <NodeList title="Sugerido em" ids={c.relatedIn} byId={byId} onPick={onPick} />
      <NodeList title="Sugere" ids={c.relatedOut} byId={byId} onPick={onPick} />
      <NodeList title="Tags" ids={c.tags} byId={byId} onPick={onPick} />
      <NodeList title="Season" ids={c.seasons} byId={byId} onPick={onPick} />
      <NodeList title="Posts" ids={tagPosts} byId={byId} onPick={onPick} />
    </div>
  );
}

function Graph({ graph, color, dark, selected, onSelect, search }) {
  const wrap = useRef(null);
  const svg = useRef(null);
  const [width, setWidth] = useState(800);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState(null);
  const [, setFrame] = useState(0);
  const raf = useRef(0);
  const gesture = useRef(null);

  const sim = useMemo(() => {
    const s = createSimulation(graph.nodes, graph.links);
    s.run(WARM_TICKS);
    return s;
  }, [graph]);

  const loop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const step = () => {
      if (sim.isSettled()) return;
      sim.tick();
      setFrame((f) => f + 1);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [sim]);

  useEffect(() => {
    loop();
    return () => cancelAnimationFrame(raf.current);
  }, [loop]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || 800));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = () => setView(fitView(sim, width));

  // Enquadra ao abrir, quando os filtros mudam o desenho e quando a largura muda
  // (ajuste durante o render, sem efeito: https://react.dev/learn/you-might-not-need-an-effect)
  const [fitted, setFitted] = useState({ sim: null, width: 0 });
  if (fitted.sim !== sim || fitted.width !== width) {
    setFitted({ sim, width });
    setView(fitView(sim, width));
  }

  // Escolhido fora do mapa (busca, painel): centraliza nele. Clique no mapa não mexe na tela.
  const [centered, setCentered] = useState(selected);
  if (centered !== selected) {
    setCentered(selected);
    const n = selected && sim.node(selected);
    if (n) setView((v) => ({ ...v, x: width / 2 - n.x * v.k, y: HEIGHT / 2 - n.y * v.k }));
  }
  const pick = (id) => {
    setCentered(id);
    onSelect(id);
  };

  // Zoom na roda do mouse, em volta do ponteiro (listener não passivo para não rolar a página)
  useEffect(() => {
    const el = svg.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        const k = Math.min(4, Math.max(0.15, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const toWorld = (e) => {
    const rect = svg.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - view.x) / view.k, y: (e.clientY - rect.top - view.y) / view.k };
  };

  const onNodeDown = (e, node) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    gesture.current = { type: "node", node: sim.node(node.id), startX: e.clientX, startY: e.clientY, moved: false };
  };

  const onBackgroundDown = (e) => {
    gesture.current = { type: "pan", startX: e.clientX, startY: e.clientY, view, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 3) g.moved = true;
    if (!g.moved) return;
    if (g.type === "pan") {
      setView({ ...g.view, x: g.view.x + e.clientX - g.startX, y: g.view.y + e.clientY - g.startY });
    } else {
      const p = toWorld(e);
      g.node.fx = p.x;
      g.node.fy = p.y;
      sim.setAlphaTarget(0.3);
      sim.reheat();
      loop();
    }
  };

  const onUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.type === "node") {
      g.node.fx = null;
      g.node.fy = null;
      sim.setAlphaTarget(0);
      if (!g.moved) pick(g.node.id === selected ? null : g.node.id);
    } else if (!g.moved) {
      pick(null);
    }
  };

  const focus = hover || selected;
  const near = focus ? neighborsOf(focus, graph.links) : null;
  const term = search.trim().toLowerCase();
  const matches = (n) => term.length >= 2 && n.label.toLowerCase().includes(term);
  const surface = dark ? "#111827" : "#ffffff";
  const ink = dark ? "#e5e7eb" : "#1f2937";
  const lineColor = dark ? "#6b7280" : "#9ca3af";

  const dim = (id) => focus && id !== focus && !near.has(id);
  const showLabel = (n) =>
    n.id === focus || near?.has(n.id) || matches(n) || (n.type === "post" ? view.k >= 1.6 : view.k >= 2.2);

  const hovered = hover ? sim.node(hover) : null;

  return (
    <div ref={wrap} className="relative rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
      <svg
        ref={svg}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Mapa de conteúdo: posts, tags e seasons ligados. A lista abaixo traz o mesmo conteúdo em texto."
        className="block touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={lineColor} />
          </marker>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {sim.links.map((l) => {
            const faded = focus && l.s.id !== focus && l.t.id !== focus;
            const directed = l.type === "link" || l.type === "related";
            // A seta para na borda do nó de destino
            const dx = l.t.x - l.s.x;
            const dy = l.t.y - l.s.y;
            const d = Math.hypot(dx, dy) || 1;
            const r = nodeRadius(l.t) + 2;
            return (
              <line
                key={`${l.type}:${l.s.id}>${l.t.id}`}
                x1={l.s.x}
                y1={l.s.y}
                x2={directed ? l.t.x - (dx / d) * r : l.t.x}
                y2={directed ? l.t.y - (dy / d) * r : l.t.y}
                stroke={lineColor}
                strokeWidth={(l.type === "link" ? 1.6 : 1) / Math.sqrt(view.k)}
                strokeDasharray={l.type === "related" ? "2 3" : undefined}
                strokeOpacity={faded ? 0.08 : l.type === "tag" || l.type === "season" ? 0.35 : 0.7}
                markerEnd={directed ? "url(#arrow)" : undefined}
              />
            );
          })}
          {sim.nodes.map((n) => {
            const r = nodeRadius(n);
            const opacity = dim(n.id) ? 0.15 : 1;
            const fill = n.type === "post" ? color(n.category) : n.type === "tag" ? (dark ? "#6b7280" : "#9ca3af") : surface;
            const live = n.type !== "post" || n.status === "published";
            const ring = n.id === selected || matches(n);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                opacity={opacity}
                className="cursor-pointer"
                onPointerDown={(e) => onNodeDown(e, n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                {/* Alvo maior que a bolinha */}
                <circle r={Math.max(r + 6, 10)} fill="transparent" />
                {n.type === "season" ? (
                  <rect x={-r} y={-r} width={r * 2} height={r * 2} transform="rotate(45)" fill={fill} stroke={ink} strokeWidth={2} />
                ) : (
                  <circle
                    r={r}
                    fill={live ? fill : surface}
                    stroke={live ? surface : fill}
                    strokeWidth={live ? 1.5 : 2}
                    strokeDasharray={live ? undefined : "3 2"}
                  />
                )}
                {ring && <circle r={r + 4} fill="none" stroke={ink} strokeWidth={1.5} />}
                {showLabel(n) && (
                  <text
                    y={r + 12 / view.k + 2}
                    textAnchor="middle"
                    fontSize={11 / view.k}
                    fill={ink}
                    stroke={surface}
                    strokeWidth={3 / view.k}
                    paintOrder="stroke"
                    className="pointer-events-none"
                  >
                    {n.label.length > 40 ? `${n.label.slice(0, 38)}…` : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-lg border bg-white dark:bg-gray-800 shadow px-3 py-2 text-xs"
          style={{
            left: Math.min(width - 220, Math.max(8, hovered.x * view.k + view.x + 14)),
            top: Math.max(8, hovered.y * view.k + view.y - 10),
          }}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100">{hovered.label}</p>
          <p className="text-gray-500 dark:text-gray-300">
            {hovered.type === "post"
              ? `${STATUS_LABEL[hovered.status]} · ${hovered.views} leituras · ${hovered.inbound} ligação(ões) chegando`
              : `${hovered.count} post(s)`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={fit}
        className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg border bg-white/90 dark:bg-gray-900/90 px-2.5 py-1 text-xs"
      >
        <Maximize2 size={13} aria-hidden="true" /> Enquadrar
      </button>
    </div>
  );
}

function InsightCard({ icon: Icon, title, hint, count, children }) {
  return (
    <section className="rounded-xl border bg-white dark:bg-gray-900 p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon size={18} aria-hidden="true" /> {title}
        <span className="ml-auto text-sm tabular-nums text-gray-500 dark:text-gray-300">{count}</span>
      </h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{hint}</p>
      <div className="mt-3 max-h-64 overflow-y-auto text-sm">{children}</div>
    </section>
  );
}

const PostLink = ({ post }) => (
  <Link to={`/admin/posts/${post.id}`} className="font-medium hover:underline">
    {post.title}
  </Link>
);

/**
 * Mapa de conteúdo: como os posts se ligam (links no texto, leituras sugeridas,
 * tags e seasons), no estilo do grafo do Obsidian, e o que pede ação.
 */
export default function ContentMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState({ tags: true, seasons: true, related: true, drafts: false, categories: [] });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const dark = useDark();

  useEffect(() => {
    DashboardService.getContentMap()
      .then(setData)
      .catch(() => setError("Erro ao carregar o mapa."));
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const color = useCallback(
    (slug) => {
      const i = categories.findIndex((c) => c.slug === slug);
      const pair = i >= 0 && i < SERIES.length ? SERIES[i] : OTHER;
      return pair[dark ? 1 : 0];
    },
    [categories, dark]
  );
  const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.label || slug;

  const graph = useMemo(() => (data ? filterGraph(data, show) : null), [data, show]);
  const byId = useMemo(() => new Map((data?.nodes || []).map((n) => [n.id, n])), [data]);
  const selectedNode = selected && graph?.nodes.some((n) => n.id === selected) ? byId.get(selected) : null;

  const onSearch = (e) => {
    e.preventDefault();
    const term = search.trim().toLowerCase();
    const hit = graph?.nodes.find((n) => n.label.toLowerCase().includes(term));
    if (hit) setSelected(hit.id);
  };

  const posts = useMemo(
    () => (data?.nodes || []).filter((n) => n.type === "post").sort((a, b) => b.inbound - a.inbound || a.label.localeCompare(b.label, "pt-BR")),
    [data]
  );
  const ins = data?.insights;

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Network size={22} /> Mapa de conteúdo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Como os posts se ligam: links dentro do texto, leituras sugeridas, tags e seasons. Post sem nada chegando é
            difícil de achar, para o leitor e para o Google.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && <Skeleton className="w-full" style={{ height: HEIGHT }} rounded="rounded-xl" />}

        {data && (
          <>
            {ins && (
              <p className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                {ins.totals.published} publicados de {ins.totals.posts} posts · {ins.totals.internalLinks} links internos ·{" "}
                {ins.totals.tags} tags · {ins.totals.seasons} seasons
              </p>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <legend className="sr-only">Mostrar no mapa</legend>
                {FILTERS.map((f) => (
                  <label key={f.key} className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={show[f.key]} onChange={(e) => setShow((s) => ({ ...s, [f.key]: e.target.checked }))} />
                    {f.label}
                  </label>
                ))}
              </fieldset>
              <form onSubmit={onSearch} className="lg:ml-auto relative w-full lg:w-72">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Buscar no mapa"
                  placeholder="Buscar post ou tag (Enter centraliza)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-8 text-sm"
                />
              </form>
            </div>

            <Legend
              categories={categories}
              color={color}
              active={show.categories}
              onToggle={(slug) =>
                setShow((s) => ({
                  ...s,
                  categories: s.categories.includes(slug) ? s.categories.filter((c) => c !== slug) : [...s.categories, slug],
                }))
              }
              onClear={() => setShow((s) => ({ ...s, categories: [] }))}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              {graph.nodes.length === 0 ? (
                <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">Nenhum post para mostrar.</p>
              ) : (
                <Graph graph={graph} color={color} dark={dark} selected={selectedNode?.id || null} onSelect={setSelected} search={search} />
              )}
              <aside className="rounded-xl border bg-white dark:bg-gray-900 p-4 lg:max-h-[620px] lg:overflow-y-auto" aria-live="polite">
                <DetailPanel
                  node={selectedNode}
                  links={graph.links}
                  byId={byId}
                  categoryLabel={categoryLabel}
                  onPick={setSelected}
                  onClose={() => setSelected(null)}
                />
              </aside>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                icon={Unlink}
                title="Posts órfãos"
                count={ins.orphans.length}
                hint="Publicados que nenhum outro post publicado aponta (no texto ou nas leituras sugeridas). Ponha um link para eles em posts do mesmo assunto."
              >
                {ins.orphans.length === 0 ? (
                  <p className="text-gray-500">Nenhum. Todo post publicado recebe ao menos uma ligação.</p>
                ) : (
                  <ul className="space-y-1">
                    {ins.orphans.map((p) => (
                      <li key={p.id}>
                        <PostLink post={p} />
                      </li>
                    ))}
                  </ul>
                )}
              </InsightCard>

              <InsightCard
                icon={Link2Off}
                title="Links internos com problema"
                count={ins.brokenLinks.length}
                hint="Links no texto para post que não existe, está na lixeira, ainda não saiu ou mudou de endereço."
              >
                {ins.brokenLinks.length === 0 ? (
                  <p className="text-gray-500">Nenhum.</p>
                ) : (
                  <ul className="space-y-2">
                    {ins.brokenLinks.map((b, i) => (
                      <li key={`${b.from.id}-${b.href}-${i}`}>
                        <PostLink post={b.from} />
                        <p className="text-xs text-gray-500 dark:text-gray-300 break-all">
                          {b.href} → {REASON_LABEL[b.reason]}
                          {b.reason === "old-slug" && b.target ? ` (troque por /blog/${b.target.slug})` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </InsightCard>

              <InsightCard
                icon={Tag}
                title="Tags usadas uma vez"
                count={ins.singleTags.length}
                hint="Uma tag num post só não liga nada a nada. Use a mesma tag em outro post ou troque por uma que já existe."
              >
                {ins.singleTags.length === 0 ? (
                  <p className="text-gray-500">Nenhuma.</p>
                ) : (
                  <ul className="space-y-1">
                    {ins.singleTags.map((t) => (
                      <li key={t.tag}>
                        <span className="font-mono text-xs">#{t.tag}</span> em <PostLink post={t.post} />
                      </li>
                    ))}
                  </ul>
                )}
              </InsightCard>
            </div>

            <details className="rounded-xl border bg-white dark:bg-gray-900 p-4">
              <summary className="cursor-pointer font-semibold">Ver como lista</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="py-2 pr-3">Post</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Ligações chegando</th>
                      <th className="py-2 text-right">Leituras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id} className="border-t dark:border-gray-800">
                        <td className="py-1.5 pr-3">
                          <Link to={`/admin/posts/${p.id}`} className="hover:underline">
                            {p.label}
                          </Link>
                        </td>
                        <td className="py-1.5 pr-3">{categoryLabel(p.category)}</td>
                        <td className="py-1.5 pr-3">{STATUS_LABEL[p.status]}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{p.inbound}</td>
                        <td className="py-1.5 text-right tabular-nums">{p.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </main>
    </>
  );
}
