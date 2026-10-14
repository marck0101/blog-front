import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import PostsService from "../../services/posts.service";
import SeasonsService from "../../services/seasons.service";
import { seasonStatus, useSeasonProgress } from "../../utils/seasonProgress";
import { formatMinutes } from "../../utils/readingTime";

/**
 * SeasonNav — navegação entre episódios publicados da mesma season.
 * Episódios em rascunho/planejados não aparecem, então nunca gera link quebrado.
 *
 * variant="badge" → selo curto no topo do post
 * variant="full"  → anterior/próximo + lista de episódios no fim do post; no
 *                   último episódio, chamada para a próxima season ou a newsletter
 */
export default function SeasonNav({ post, variant = "full" }) {
  const [data, setData] = useState(null);
  // Outras seasons (para indicar a próxima no fim do último episódio)
  const [allSeasons, setAllSeasons] = useState([]);
  const progress = useSeasonProgress();

  useEffect(() => {
    if (!post?.season) return;
    let cancelled = false;
    PostsService.getSeasonEpisodes(post.season)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [post?.season]);

  useEffect(() => {
    if (!post?.season || variant !== "full") return;
    SeasonsService.getPublic().then(setAllSeasons).catch(() => {});
  }, [post?.season, variant]);

  if (!post?.season || !data?.season) return null;

  const episodes = data.posts || [];
  const index = episodes.findIndex((p) => p.slug === post.slug);
  const prev = index > 0 ? episodes[index - 1] : null;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null;
  const label = data.season.title;
  const seasonUrl = `/seasons/${data.season.slug}`;
  const { read } = seasonStatus(progress, data.season.slug, episodes.map((e) => e.slug));
  const isLast = index >= 0 && !next;
  // Próxima season: a primeira que a pessoa ainda não terminou
  const nextSeason = isLast
    ? allSeasons.find(
        (s) => s.slug !== data.season.slug && !seasonStatus(progress, s.slug, s.episodeSlugs).done
      )
    : null;

  if (variant === "badge") {
    return (
      <a
        href="#season-nav"
        className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-sm font-medium
          bg-blue-50 text-blue-700 border border-blue-200
          dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 hover:underline"
      >
        Season: {label}
        {index >= 0 && <span className="opacity-75">{" "}· Episódio {index + 1} de {episodes.length}</span>}
      </a>
    );
  }

  return (
    <nav
      id="season-nav"
      aria-label={`Episódios da season ${label}`}
      className="mt-12 rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Season
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
        <Link to={seasonUrl} className="hover:underline">{label}</Link>
      </h2>

      {(prev || next) && (
        <div className="grid gap-3 sm:grid-cols-2 mt-5">
          {prev ? (
            <Link
              to={`/blog/${prev.slug}`}
              className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3
                bg-white dark:bg-gray-800 hover:border-blue-400 transition"
            >
              <ChevronLeft className="w-4 h-4 mt-1 shrink-0" />
              <span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Anterior</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{prev.title}</span>
              </span>
            </Link>
          ) : <span className="hidden sm:block" />}
          {next && (
            <Link
              to={`/blog/${next.slug}`}
              className="flex items-start justify-end gap-2 text-right rounded-lg border border-gray-200 dark:border-gray-700 p-3
                bg-white dark:bg-gray-800 hover:border-blue-400 transition"
            >
              <span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Próximo</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{next.title}</span>
              </span>
              <ChevronRight className="w-4 h-4 mt-1 shrink-0" />
            </Link>
          )}
        </div>
      )}

      <ol className="mt-5 space-y-1 list-decimal list-inside text-sm">
        {episodes.map((ep) => (
          <li key={ep._id} className="text-gray-700 dark:text-gray-300">
            {ep.slug === post.slug ? (
              <span className="font-semibold text-gray-900 dark:text-white">{ep.title} (você está aqui)</span>
            ) : (
              <Link to={`/blog/${ep.slug}`} className="hover:underline">{ep.title}</Link>
            )}
            {read.has(ep.slug) && (
              <CheckCircle2 size={14} className="inline ml-1.5 -mt-0.5 text-green-600 dark:text-green-400" aria-label="lido" />
            )}
          </li>
        ))}
      </ol>

      <Link
        to={seasonUrl}
        className="inline-block mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        Ver a season completa →
      </Link>

      {isLast && (
        <div className="mt-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4">
          <p className="font-semibold text-gray-900 dark:text-white">Você chegou ao fim desta season 🎉</p>
          {nextSeason ? (
            <>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Próxima: <strong>{nextSeason.title}</strong> · {nextSeason.episodes}{" "}
                {nextSeason.episodes === 1 ? "episódio" : "episódios"}
                {nextSeason.readingMinutes > 0 && <> · ~{formatMinutes(nextSeason.readingMinutes)}</>}
              </p>
              <Link
                to={`/seasons/${nextSeason.slug}`}
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Começar a próxima season →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Assine a newsletter para saber quando sair a próxima.
              </p>
              <a
                href="#assinar"
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Assinar a newsletter
              </a>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
