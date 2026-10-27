import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import DateRangePicker from "../../components/DateRangePicker";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostsService from "../../services/posts.service";
import ConfirmDialog from "../../components/ConfirmDialog";
import CampaignService from "../../services/campaign.service";
import { POST_STATUS, isOverdue, postStatusKey } from "../../utils/postStatus";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_STYLE = {
  published: POST_STATUS.published.style,
  planned:   POST_STATUS.planned.style,
  draft:     POST_STATUS.draft.style,
  // Rascunho sem data: aparece no dia em que foi criado
  undated:   "border border-dashed border-gray-400 text-gray-500 dark:text-gray-400",
  overdue:   "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function postStyleKey(post) {
  if (isOverdue(post)) return "overdue";
  const key = postStatusKey(post);
  if (key === "draft" && !post.plannedAt) return "undated";
  return key;
}

// Dia do post no calendário: publicado → publicação; senão data planejada; senão criação
function postDay(post) {
  if (postStatusKey(post) === "published" && post.publishedAt) return post.publishedAt;
  return post.plannedAt || post.createdAt;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Dias de start a end em semanas completas (Dom–Sáb); fora do intervalo = null
function buildCalendarGrid(start, end) {
  const cells = [];
  for (let i = 0; i < start.getDay(); i++) cells.push(null);
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Visões do calendário (?visao=): mês, semana ou período personalizado (?de=&ate=)
const VIEWS = [
  { key: "mes", label: "Mês" },
  { key: "semana", label: "Semana" },
  { key: "periodo", label: "Período" },
];
const MAX_RANGE_DAYS = 366; // o backend também limita

const parseDay = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

// Intervalo visível de cada visão. `anchor` = dia de referência (?data=)
function viewRange(view, anchor, from, to) {
  if (view === "semana") {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 6) };
  }
  if (view === "periodo" && from && to && from <= to) {
    const end = differenceInCalendarDays(to, from) >= MAX_RANGE_DAYS ? addDays(from, MAX_RANGE_DAYS - 1) : to;
    return { start: from, end };
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

function rangeTitle(view, start, end) {
  if (view === "mes") {
    const label = format(start, "MMMM yyyy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const left = format(start, sameMonth ? "d" : sameYear ? "d MMM" : "d MMM yyyy", { locale: ptBR });
  const right = format(end, "d MMM yyyy", { locale: ptBR });
  return `${left} – ${right}`;
}

// Envios de email: contorno colorido para diferenciar dos posts
const EMAIL_STYLE = {
  sent:    "border-emerald-500 text-emerald-700 dark:text-emerald-300",
  failed:  "border-red-500 text-red-700 dark:text-red-300",
  sending: "border-amber-500 text-amber-700 dark:text-amber-300",
  draft:   "border-dashed border-gray-400 text-gray-500 dark:text-gray-300",
};

// Filtros (multi-seleção; nenhum = tudo). Atrasado conta como agendado.
const FILTERS = [
  { key: "published", label: "Publicados", style: POST_STATUS.published.style },
  { key: "planned", label: "Agendados", style: POST_STATUS.planned.style },
  { key: "draft", label: "Rascunhos", style: POST_STATUS.draft.style },
  { key: "emails", label: "Envios", style: "border border-emerald-500 text-emerald-700 dark:text-emerald-300" },
];
const FILTER_KEYS = FILTERS.map((f) => f.key);

// Itens por dia antes do "+N": filtrado sobra espaço, mostra mais
const DAY_LIMIT = { all: { posts: 3, emails: 2 }, filtered: { posts: 6, emails: 6 } };

function emailStyleKey(email) {
  if (email.status === "sent" && email.stats.failed > 0) return "failed";
  return email.status;
}

function EmailBadge({ email }) {
  const auto = email.kind === "post-notification";
  const subject = auto ? email.subject.replace(/^Novo artigo: /, "").replace(/ \| marck0101$/, "") : email.subject;
  const detail =
    email.status === "draft"
      ? "rascunho"
      : `${email.stats.sent}/${email.stats.total} entregues${email.stats.failed ? `, ${email.stats.failed} falha(s)` : ""}`;

  return (
    <Link
      to={`/admin/campaigns/${email._id}`}
      title={`${auto ? "Aviso automático: " : "Envio: "}${subject} (${detail})`}
      className={`block text-[10px] leading-tight px-1.5 py-0.5 rounded border bg-white dark:bg-gray-900 truncate ${EMAIL_STYLE[emailStyleKey(email)]}`}
    >
      ✉️ {subject}
    </Link>
  );
}

// Só rascunho muda de dia arrastando (agendado tem data de publicação de verdade)
const isDraggable = (post) => postStatusKey(post) === "draft";

function PostBadge({ post, onPublish, onDragStart, onDragEnd }) {
  const label = post.title;
  const draggable = isDraggable(post);

  return (
    <div
      className={`flex items-center gap-1 group ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => {
        e.dataTransfer.setData("text/plain", post._id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(post);
      } : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      <Link
        to={`/admin/posts/${post._id}`}
        // O arraste é do bloco inteiro, não do link (o navegador arrastaria a URL)
        draggable={false}
        className={`flex-1 text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${STATUS_STYLE[postStyleKey(post)]}`}
        title={`${post.title} (${isOverdue(post) ? "Agendado, atrasado" : POST_STATUS[postStatusKey(post)].label})${draggable ? " · arraste para outro dia" : ""}`}
      >
        {label}
      </Link>
      {post.status === "planned" && (
        <button
          onClick={() => onPublish(post._id)}
          title="Publicar agora"
          className="shrink-0 hidden group-hover:flex text-[9px] bg-green-600 text-white px-1 py-0.5 rounded leading-tight"
        >
          ✓
        </button>
      )}
    </div>
  );
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();

  const [posts, setPosts] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // Dia aberto no painel com a lista completa (quando não cabe na célula)
  const [openDay, setOpenDay] = useState(null);
  // Arrastar rascunho: o post em movimento, o dia sob o cursor e a mudança a confirmar
  const [dragging, setDragging] = useState(null);
  const [dropKey, setDropKey] = useState(null);
  const [pendingMove, setPendingMove] = useState(null); // { post, day }
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!openDay) return;
    const onKey = (e) => e.key === "Escape" && setOpenDay(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDay]);

  // Visão, data e filtros na URL: sobrevivem à navegação e ao recarregar
  const [searchParams, setSearchParams] = useSearchParams();
  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      next.delete(k);
      [].concat(v ?? []).forEach((item) => next.append(k, item));
    });
    setSearchParams(next, { replace: true });
  };

  const view = VIEWS.some((v) => v.key === searchParams.get("visao")) ? searchParams.get("visao") : "mes";
  const anchor = parseDay(searchParams.get("data")) || today;
  const { start, end } = viewRange(view, anchor, parseDay(searchParams.get("de")), parseDay(searchParams.get("ate")));
  const fromKey = toDateKey(start);
  const toKey = toDateKey(end);
  const cells = useMemo(() => buildCalendarGrid(parseISO(fromKey), parseISO(toKey)), [fromKey, toKey]);

  const selected = searchParams.getAll("ver").filter((v) => FILTER_KEYS.includes(v));
  const filtering = selected.length > 0;
  const showsPost = (p) => !filtering || selected.includes(postStatusKey(p));
  const showsEmails = !filtering || selected.includes("emails");
  // Semana: célula alta, mostra tudo
  const limit = view === "semana" ? { posts: Infinity, emails: Infinity } : DAY_LIMIT[filtering ? "filtered" : "all"];

  const toggleFilter = (key) =>
    updateParams({ ver: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key] });
  const clearFilter = () => updateParams({ ver: [] });

  // Trocar de visão mantém o contexto: o período começa com o que estava na tela
  const changeView = (next) => {
    if (next === view) return;
    if (next === "periodo") updateParams({ visao: next, de: fromKey, ate: toKey, data: [] });
    else updateParams({ visao: next === "mes" ? [] : next, data: fromKey, de: [], ate: [] });
  };

  // Anterior/próximo: um mês, uma semana ou um período do mesmo tamanho
  const shift = (dir) => {
    if (view === "periodo") {
      const days = differenceInCalendarDays(end, start) + 1;
      updateParams({ de: toDateKey(addDays(start, dir * days)), ate: toDateKey(addDays(end, dir * days)) });
    } else {
      updateParams({ data: toDateKey(view === "semana" ? addDays(anchor, dir * 7) : addMonths(startOfMonth(anchor), dir)) });
    }
  };

  const goToday = () => {
    if (view === "periodo") {
      const days = differenceInCalendarDays(end, start);
      updateParams({ de: toDateKey(today), ate: toDateKey(addDays(today, days)) });
    } else {
      updateParams({ data: [] });
    }
  };

  // Quantos de cada tipo no mês (o número no chip)
  const counts = useMemo(() => {
    const c = { published: 0, planned: 0, draft: 0, emails: emails.length };
    posts.forEach((p) => { c[postStatusKey(p)] = (c[postStatusKey(p)] || 0) + 1; });
    return c;
  }, [posts, emails]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.filter(showsPost).forEach((p) => {
      // Rascunho sem data planejada aparece no dia em que foi criado
      const ref = postDay(p);
      if (!ref) return;
      const key = toDateKey(new Date(ref));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts, selected.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const emailsByDay = useMemo(() => {
    const map = {};
    (showsEmails ? emails : []).forEach((e) => {
      const key = toDateKey(new Date(e.date));
      (map[key] ||= []).push(e);
    });
    return map;
  }, [emails, showsEmails]);

  // Busca o intervalo visível; navegar rápido descarta respostas de telas antigas
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const range = { from: fromKey, to: toKey };
    Promise.all([
      PostsService.getCalendar(range).catch(() => []),
      CampaignService.getCalendar(range).catch(() => []),
    ])
      .then(([postsData, emailsData]) => {
        if (cancelled) return;
        setPosts(postsData);
        setEmails(emailsData);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [fromKey, toKey]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = async (id) => {
    try {
      await PostsService.publishNow(id);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, status: "published", published: true, publishedAt: new Date().toISOString() }
            : p
        )
      );
      showToast("Post publicado com sucesso!");
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao publicar post", "error");
    }
  };

  const endDrag = () => {
    setDragging(null);
    setDropKey(null);
  };

  const handleDrop = (day) => {
    const post = dragging;
    endDrag();
    if (!post || toDateKey(new Date(postDay(post))) === toDateKey(day)) return;
    setPendingMove({ post, day });
  };

  const confirmMove = async () => {
    const { post, day } = pendingMove;
    setMoving(true);
    try {
      // "YYYY-MM-DD": o backend grava ao meio-dia UTC (mesmo dia em todo o Brasil)
      const saved = await PostsService.update(post._id, { plannedAt: toDateKey(day) });
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, plannedAt: saved?.plannedAt ?? p.plannedAt } : p)));
      showToast(`Rascunho movido para ${day.toLocaleDateString("pt-BR")}`);
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao mudar a data do rascunho", "error");
    } finally {
      setMoving(false);
      setPendingMove(null);
    }
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const key = toDateKey(day);
    navigate(`/admin/create-post?plannedAt=${key}`);
  };

  const todayKey = toDateKey(today);

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => shift(-1)} aria-label="Anterior" className="p-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">
              {rangeTitle(view, start, end)}
            </h1>
            <button onClick={() => shift(1)} aria-label="Próximo" className="p-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Visão: mês, semana ou período */}
            <div className="inline-flex rounded-lg border p-0.5 bg-gray-50 dark:bg-gray-900" role="group" aria-label="Visualização">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => changeView(v.key)}
                  aria-pressed={view === v.key}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    view === v.key
                      ? "bg-white dark:bg-gray-700 shadow-sm font-medium text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {view === "periodo" && (
              <DateRangePicker
                from={fromKey}
                to={toKey}
                onChange={(de, ate) => de && ate && updateParams({ de, ate })}
              />
            )}
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
            >
              Hoje
            </button>
            <Link
              to="/admin/create-post"
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              + Novo post
            </Link>
          </div>
        </div>

        {/* Filtros (também servem de legenda: cada chip tem a cor do tipo) */}
        <div className="flex items-center flex-wrap gap-2 mb-2" role="group" aria-label="Filtrar o calendário">
          <button
            type="button"
            onClick={clearFilter}
            aria-pressed={!filtering}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
              !filtering
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-500"
            }`}
          >
            Tudo
          </button>
          {FILTERS.map((f) => {
            const active = selected.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${f.style} ${
                  active
                    ? "ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-950"
                    : filtering
                    ? "opacity-50 hover:opacity-100"
                    : "hover:ring-1 hover:ring-gray-400"
                }`}
              >
                {f.key === "emails" && "✉️ "}
                {f.label}
                <span className="text-xs tabular-nums opacity-70">{counts[f.key] || 0}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span className={`px-1.5 py-0.5 rounded ${STATUS_STYLE.overdue}`}>laranja</span> = agendado atrasado ·{" "}
          <span className={`px-1.5 py-0.5 rounded ${STATUS_STYLE.undated}`}>tracejado</span> = rascunho sem data ·
          clique num dia vazio para criar um rascunho · arraste um rascunho para mudar o dia
        </p>

        {/* Grid */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b dark:border-gray-800">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-300">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const key = day ? toDateKey(day) : null;
                const dayPosts = key ? (postsByDay[key] || []) : [];
                const dayEmails = key ? (emailsByDay[key] || []) : [];
                const isToday = key === todayKey;

                return (
                  <div
                    key={idx}
                    onClick={() => day && dayPosts.length === 0 && dayEmails.length === 0 && handleDayClick(day)}
                    onDragOver={day && dragging ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dropKey !== key) setDropKey(key);
                    } : undefined}
                    onDrop={day && dragging ? (e) => {
                      e.preventDefault();
                      handleDrop(day);
                    } : undefined}
                    className={`${view === "semana" ? "min-h-[420px]" : "min-h-[100px]"} p-1.5 border-r border-b dark:border-gray-800 last:border-r-0 transition
                      ${day ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : "bg-gray-50 dark:bg-gray-800/30 opacity-40"}
                      ${dragging && key === dropKey ? "!bg-blue-50 dark:!bg-blue-900/30 ring-2 ring-inset ring-blue-400" : ""}
                    `}
                  >
                    {day && (
                      <>
                        {/* Número do dia */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dayPosts.length || dayEmails.length) setOpenDay(day);
                            else handleDayClick(day);
                          }}
                          aria-label={`Ver o dia ${day.toLocaleDateString("pt-BR")}`}
                          className={`text-xs font-semibold mb-1 h-6 min-w-6 px-1.5 inline-flex items-center justify-center rounded-full hover:ring-2 hover:ring-blue-300
                          ${isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {/* Fora do mês: o dia 1 e o primeiro dia da grade mostram o mês */}
                          {view !== "mes" && (day.getDate() === 1 || key === fromKey)
                            ? format(day, "d MMM", { locale: ptBR })
                            : day.getDate()}
                        </button>

                        {/* Posts */}
                        <div className="space-y-0.5">
                          {dayPosts.slice(0, limit.posts).map((p) => (
                            <PostBadge key={p._id} post={p} onPublish={handlePublish} onDragStart={setDragging} onDragEnd={endDrag} />
                          ))}
                          {dayEmails.slice(0, limit.emails).map((e) => (
                            <EmailBadge key={e._id} email={e} />
                          ))}
                          {(dayPosts.length > limit.posts || dayEmails.length > limit.emails) && (
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setOpenDay(day);
                              }}
                              className="block text-[10px] font-medium text-blue-600 dark:text-blue-400 pl-1 hover:underline"
                            >
                              +{Math.max(dayPosts.length - limit.posts, 0) + Math.max(dayEmails.length - limit.emails, 0)} · ver todos
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(pendingMove)}
        type="info"
        title="Mudar a data do rascunho?"
        description={pendingMove && (() => {
          const from = pendingMove.post.plannedAt
            ? new Date(postDay(pendingMove.post)).toLocaleDateString("pt-BR")
            : "sem data";
          return `"${pendingMove.post.title}" passa de ${from} para ${pendingMove.day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}. Continua como rascunho.`;
        })()}
        confirmText={moving ? "Movendo..." : "Mudar data"}
        cancelText="Manter como está"
        onCancel={() => !moving && setPendingMove(null)}
        onConfirm={() => !moving && confirmMove()}
      />

      {openDay && (() => {
        const key = toDateKey(openDay);
        const list = postsByDay[key] || [];
        const mails = emailsByDay[key] || [];
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setOpenDay(null)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Dia ${openDay.toLocaleDateString("pt-BR")}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b">
                <h2 className="font-semibold capitalize">
                  {openDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </h2>
                <button type="button" onClick={() => setOpenDay(null)} aria-label="Fechar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
              </div>
              <div className="overflow-y-auto p-5 space-y-5">
                {list.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-2">Posts ({list.length})</h3>
                    <ul className="space-y-1.5">
                      {list.map((p) => (
                        <li key={p._id} className="flex items-center gap-2">
                          <span className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded ${STATUS_STYLE[postStyleKey(p)]}`}>
                            {isOverdue(p) ? "Atrasado" : POST_STATUS[postStatusKey(p)].label}
                          </span>
                          <Link to={`/admin/posts/${p._id}`} className="text-sm hover:underline">{p.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {mails.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-2">Envios ({mails.length})</h3>
                    <div className="space-y-1">
                      {mails.map((m) => <EmailBadge key={m._id} email={m} />)}
                    </div>
                  </section>
                )}
                <button
                  type="button"
                  onClick={() => handleDayClick(openDay)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Novo rascunho neste dia
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
