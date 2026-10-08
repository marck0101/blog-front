import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostsService from "../../services/posts.service";
import CampaignService from "../../services/campaign.service";
import { POST_STATUS, isOverdue, postStatusKey } from "../../utils/postStatus";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
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

// Envios de email: contorno colorido para diferenciar dos posts
const EMAIL_STYLE = {
  sent:    "border-emerald-500 text-emerald-700 dark:text-emerald-300",
  failed:  "border-red-500 text-red-700 dark:text-red-300",
  sending: "border-amber-500 text-amber-700 dark:text-amber-300",
  draft:   "border-dashed border-gray-400 text-gray-500 dark:text-gray-300",
};

function emailStyleKey(email) {
  if (email.status === "sent" && email.stats.failed > 0) return "failed";
  return email.status;
}

function EmailBadge({ email }) {
  const auto = email.kind === "post-notification";
  const subject = auto ? email.subject.replace(/^Novo artigo: /, "").replace(/ \| marck0101$/, "") : email.subject;
  const label = subject.length > 20 ? subject.slice(0, 20) + "…" : subject;
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
      ✉️ {label}
    </Link>
  );
}

function PostBadge({ post, onPublish }) {
  const label = post.title.length > 22 ? post.title.slice(0, 22) + "…" : post.title;

  return (
    <div className="flex items-center gap-1 group">
      <Link
        to={`/admin/posts/${post._id}`}
        className={`flex-1 text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${STATUS_STYLE[postStyleKey(post)]}`}
        title={`${post.title} (${isOverdue(post) ? "Agendado, atrasado" : POST_STATUS[postStatusKey(post)].label})`}
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
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      // Rascunho sem data planejada aparece no dia em que foi criado
      const ref = postDay(p);
      if (!ref) return;
      const key = toDateKey(new Date(ref));
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const emailsByDay = useMemo(() => {
    const map = {};
    emails.forEach((e) => {
      const key = toDateKey(new Date(e.date));
      (map[key] ||= []).push(e);
    });
    return map;
  }, [emails]);

  const load = () => {
    setLoading(true);
    Promise.all([
      PostsService.getCalendar(year, month).catch(() => []),
      CampaignService.getCalendar(year, month).catch(() => []),
    ])
      .then(([postsData, emailsData]) => {
        setPosts(postsData);
        setEmails(emailsData);
      })
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
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao publicar post", "error");
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

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">
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
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-xs text-gray-500 dark:text-gray-300">
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.published}`}>Publicado</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.planned}`}>Agendado (vai ao ar ~9h)</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.draft}`}>Rascunho com data</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.undated}`}>Rascunho sem data</span>
          <span className={`px-2 py-0.5 rounded ${STATUS_STYLE.overdue}`}>Atrasado</span>
          <span className={`px-2 py-0.5 rounded border ${EMAIL_STYLE.sent}`}>✉️ Email enviado</span>
          <span className={`px-2 py-0.5 rounded border ${EMAIL_STYLE.failed}`}>✉️ Com falhas</span>
          <span className={`px-2 py-0.5 rounded border ${EMAIL_STYLE.draft}`}>✉️ Rascunho</span>
          <span className="text-gray-400">Clique num dia vazio para criar um rascunho nessa data</span>
        </div>

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
                const isCurrentMonth = day?.getMonth() === month - 1;

                return (
                  <div
                    key={idx}
                    onClick={() => day && dayPosts.length === 0 && dayEmails.length === 0 && handleDayClick(day)}
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
                            <p className="text-[10px] text-gray-400 dark:text-gray-300 pl-1">
                              +{dayPosts.length - 3}
                            </p>
                          )}
                          {dayEmails.slice(0, 2).map((e) => (
                            <EmailBadge key={e._id} email={e} />
                          ))}
                          {dayEmails.length > 2 && (
                            <Link
                              to="/admin/campaigns"
                              className="block text-[10px] text-gray-400 dark:text-gray-300 pl-1 hover:underline"
                            >
                              +{dayEmails.length - 2} envio(s)
                            </Link>
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
