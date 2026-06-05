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

  useEffect(() => {
    DashboardService.getStats()
      .then(setStats)
      .catch(() => setError("Não foi possível carregar as métricas. Tente novamente."))
      .finally(() => setLoading(false));

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Banner de lembrete */}
        {!bannerDismissed && todayPlanned.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm">
            <p className="flex items-center gap-2">
              <span>📅</span>
              <span>
                Você tem <strong>{todayPlanned.length}</strong>{" "}
                post{todayPlanned.length > 1 ? "s" : ""} planejado
                {todayPlanned.length > 1 ? "s" : ""} para hoje!
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
