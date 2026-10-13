import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PostsService from "../../services/posts.service";

/**
 * SeasonNav — navegação entre episódios publicados da mesma season.
 * Episódios em rascunho/planejados não aparecem, então nunca gera link quebrado.
 *
 * variant="badge" → selo curto no topo do post
 * variant="full"  → anterior/próximo + lista de episódios no fim do post
 */
export default function SeasonNav({ post, variant = "full" }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!post?.season) return;
    let cancelled = false;
    PostsService.getSeasonEpisodes(post.season)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [post?.season]);

  if (!post?.season || !data?.season) return null;

  const episodes = data.posts || [];
  const index = episodes.findIndex((p) => p.slug === post.slug);
  const prev = index > 0 ? episodes[index - 1] : null;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : null;
  const label = data.season.label;

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
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{label}</h2>

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
          </li>
        ))}
      </ol>
    </nav>
  );
}
