import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Globe,
  PencilLine,
  Trash2,
  CalendarDays,
  AlertCircle,
  Users,
  UserCheck,
  X,
  Calendar,
  Eye,
  Search,
  TrendingUp,
} from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PublicationHeatmap from "../../components/PublicationHeatmap";
import DashboardService from "../../services/dashboard.service";
import PostsService from "../../services/posts.service";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 animate-pulse">
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function StatCard({ icon: Icon, value, label, colorClass, to }) {
  const content = (
    <div className={`rounded-xl border p-6 bg-white dark:bg-gray-900 transition hover:shadow-md ${to ? "cursor-pointer" : ""}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{label}</p>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

const BANNER_KEY = "today-planned-banner-dismissed";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [todayPlanned, setTodayPlanned] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem(BANNER_KEY) === "1"
  );

  const [heatmapData, setHeatmapData] = useState({});
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);

  useEffect(() => {
    DashboardService.getStats()
      .then(setStats)
      .catch(() => setError("Não foi possível carregar as métricas. Tente novamente."))
      .finally(() => setLoading(false));

    DashboardService.getContentPerformance(30)
      .then(setPerformance)
      .catch(() => {})
      .finally(() => setPerformanceLoading(false));

    PostsService.getTodayPlanned()
      .then(setTodayPlanned)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setHeatmapLoading(true);
    PostsService.getHeatmap(heatmapYear)
      .then(setHeatmapData)
      .catch(() => setHeatmapData({}))
      .finally(() => setHeatmapLoading(false));
  }, [heatmapYear]);

  const dismissBanner = () => {
    sessionStorage.setItem(BANNER_KEY, "1");
    setBannerDismissed(true);
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Banner de lembrete */}
        {!bannerDismissed && todayPlanned.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm">
            <p className="flex items-center gap-2">
              <span>📅</span>
              <span>
                Você tem <strong>{todayPlanned.length}</strong>{" "}
                post{todayPlanned.length > 1 ? "s" : ""} agendado
                {todayPlanned.length > 1 ? "s" : ""} para hoje. Vão ao ar sozinhos por volta das 9h.
              </span>
              <Link
                to="/admin/calendar"
                className="font-semibold underline hover:no-underline"
              >
                Ver no calendário →
              </Link>
            </p>
            <button
              onClick={dismissBanner}
              className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Visão geral do blog</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Cards — Posts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard icon={FileText} value={stats?.totalPosts ?? "—"} label="Total de posts" colorClass="bg-blue-500" to="/admin/posts" />
              <StatCard icon={Globe} value={stats?.published ?? "—"} label="Publicados" colorClass="bg-green-500" to="/admin/posts" />
              <StatCard icon={PencilLine} value={stats?.drafts ?? "—"} label="Rascunhos" colorClass="bg-amber-500" to="/admin/posts" />
              <StatCard icon={Trash2} value={stats?.deleted ?? "—"} label="Na lixeira" colorClass="bg-red-500" to="/admin/trash" />
            </>
          )}
        </div>

        {/* Cards — Assinantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard icon={UserCheck} value={stats?.activeSubscribers ?? "—"} label="Assinantes ativos" colorClass="bg-teal-500" to="/admin/subscribers" />
              <StatCard icon={Users} value={stats?.totalSubscribers ?? "—"} label="Total de assinantes" colorClass="bg-indigo-500" to="/admin/subscribers" />
            </>
          )}
        </div>

        {/* Último post */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-4">
            Último post publicado
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ) : stats?.lastPost ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug">
                  {stats.lastPost.title}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-300 mt-1">
                  <CalendarDays size={13} />
                  {new Date(stats.lastPost.publishedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <Link
                to={`/blog/${stats.lastPost.slug || stats.lastPost._id}`}
                target="_blank"
                className="shrink-0 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver post →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-300">Nenhum post publicado ainda.</p>
          )}
        </div>

        {/* Desempenho de conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-4">
              <Eye size={14} />
              Posts mais visitados
            </h2>
            {performanceLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : performance?.topPosts?.length ? (
              <ul className="space-y-3">
                {performance.topPosts.map((post) => (
                  <li key={post.slug} className="flex items-center justify-between gap-3">
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate"
                    >
                      {post.title}
                    </Link>
                    <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {post.views}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Ainda sem visualizações registradas. O contador soma a cada acesso a um post publicado.
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-1">
              <Search size={14} />
              O que estão buscando no blog
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Últimos {performance?.days ?? 30} dias — termos digitados na busca do blog
            </p>
            {performanceLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : performance?.topSearchTerms?.length ? (
              <ul className="space-y-2">
                {performance.topSearchTerms.map(({ term, count }) => (
                  <li key={term} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <TrendingUp size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      {term}
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Ninguém usou a busca do blog nesse período ainda.
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t dark:border-gray-800">
              Para dados de comportamento (scroll, tempo na página, origem do tráfego), use Clarity e Search Console — esse painel mostra só o que o próprio blog sabe sobre si.
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-4">
            Histórico de publicações
          </h2>
          {heatmapLoading ? (
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : (
            <PublicationHeatmap
              data={heatmapData}
              year={heatmapYear}
              onYearChange={setHeatmapYear}
            />
          )}
        </div>

        {/* Atalhos */}
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/create-post" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
            + Novo post
          </Link>
          <Link to="/admin/posts" className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Ver todos os posts
          </Link>
          <Link to="/admin/calendar" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Calendar size={14} />
            Calendário editorial
          </Link>
        </div>
      </main>
    </>
  );
}
