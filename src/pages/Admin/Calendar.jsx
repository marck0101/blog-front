import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostsService from "../../services/posts.service";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_STYLE = {
  published: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  planned:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildCalendarGrid(year, month) {
  // month is 1-indexed
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const cells = [];

  // Pad início
  for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }

  // Pad fim para completar semana
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function PostBadge({ post, onPublish }) {
  const label = post.title.length > 22 ? post.title.slice(0, 22) + "…" : post.title;

  return (
    <div className="flex items-center gap-1 group">
      <Link
        to={`/admin/posts/${post._id}`}
        className={`flex-1 text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${STATUS_STYLE[post.status] ?? STATUS_STYLE.draft}`}
        title={post.title}
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

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      const ref = p.plannedAt || p.publishedAt;
      if (!ref) return;
      const key = toDateKey(new Date(ref));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const load = () => {
    setLoading(true);
    PostsService.getCalendar(year, month)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch {
      showToast("Erro ao publicar post", "error");
    }
  };

  const goMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">
              {MONTHS_PT[month - 1]} {year}
            </h1>
            <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Legenda */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.published}`}>Publicado</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.planned}`}>Planejado</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.draft}`}>Rascunho</span>
          <span className="text-gray-400">Clique num dia vazio para criar post planejado</span>
        </div>

        {/* Grid */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b dark:border-gray-800">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
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
                const isToday = key === todayKey;
                const isCurrentMonth = day?.getMonth() === month - 1;

                return (
                  <div
                    key={idx}
                    onClick={() => day && dayPosts.length === 0 && handleDayClick(day)}
                    className={`min-h-[100px] p-1.5 border-r border-b dark:border-gray-800 last:border-r-0 transition
                      ${day ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : "bg-gray-50 dark:bg-gray-800/30"}
                      ${!isCurrentMonth ? "opacity-40" : ""}
                    `}
                  >
                    {day && (
                      <>
                        {/* Número do dia */}
                        <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {day.getDate()}
                        </div>

                        {/* Posts */}
                        <div className="space-y-0.5">
                          {dayPosts.slice(0, 3).map((p) => (
                            <PostBadge key={p._id} post={p} onPublish={handlePublish} />
                          ))}
                          {dayPosts.length > 3 && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                              +{dayPosts.length - 3}
                            </p>
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
    </>
  );
}
