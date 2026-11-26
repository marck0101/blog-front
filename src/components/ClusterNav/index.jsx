import { Link } from "react-router-dom";
import { BookOpen, Compass } from "lucide-react";
import { clusterLinks } from "../../utils/clusterLinks";
import { trackEvent } from "../../utils/analytics";

/**
 * "Mais deste tema" no fim do post: o artigo principal (pilar) e os vizinhos.
 * No próprio pilar, lista todos os artigos do tema.
 */
export default function ClusterNav({ post, data }) {
  const links = clusterLinks(post, data);
  if (!links) return null;
  const { cluster, isPillar, pillar, items, url } = links;
  const track = (target, kind) => () =>
    trackEvent("cluster_click", { cluster_slug: cluster.slug, post_slug: target, link_location: `post_${kind}` });

  return (
    <nav
      aria-label={`Mais do tema ${cluster.title}`}
      className="mt-12 rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900"
    >
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <Compass size={14} aria-hidden="true" /> {isPillar ? "Neste tema" : "Mais deste tema"}
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
        <Link to={url} onClick={track(cluster.slug, "title")} className="hover:underline">{cluster.title}</Link>
      </h2>

      {pillar && (
        <Link
          to={`/blog/${pillar.slug}`}
          onClick={track(pillar.slug, "pillar")}
          className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-3 hover:border-blue-400 transition"
        >
          <BookOpen size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Artigo principal do tema</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{pillar.title}</span>
          </span>
        </Link>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm list-disc list-inside marker:text-gray-400">
          {items.map((item) => (
            <li key={item.slug} className="text-gray-700 dark:text-gray-300">
              <Link to={`/blog/${item.slug}`} onClick={track(item.slug, "related")} className="hover:underline">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to={url}
        onClick={track(cluster.slug, "see_all")}
        className="inline-block mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        Ver o tema completo →
      </Link>
    </nav>
  );
}
