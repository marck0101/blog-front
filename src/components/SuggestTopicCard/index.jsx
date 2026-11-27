import { Link, useLocation } from "react-router-dom";
import { Lightbulb, ArrowRight } from "lucide-react";
import { trackEvent } from "../../utils/analytics";
import { useFeatures } from "../../utils/features";

// Link para /sugestoes guardando de onde a pessoa veio (?de=/blog/slug)
function suggestionHref(pathname) {
  return pathname === "/sugestoes" ? "/sugestoes" : `/sugestoes?de=${encodeURIComponent(pathname)}`;
}

// Etiqueta "Sugira um tema" (cabeçalho e menu do celular)
export function SuggestTopicChip({ location = "header", className = "", onClick }) {
  const { pathname } = useLocation();
  const { suggestions } = useFeatures();
  if (!suggestions || pathname === "/sugestoes") return null;
  return (
    <Link
      to={suggestionHref(pathname)}
      onClick={() => {
        trackEvent("suggestion_link_click", { link_location: location });
        onClick?.();
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 text-sm font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition ${className}`}
    >
      <Lightbulb size={15} aria-hidden="true" />
      Sugira um tema
    </Link>
  );
}

// Cartão de convite (home e fim do post)
export default function SuggestTopicCard({ location = "home", compact = false, className = "" }) {
  const { pathname } = useLocation();
  const { suggestions } = useFeatures();
  if (!suggestions) return null;
  return (
    <aside
      aria-labelledby={`sugira-${location}`}
      className={`skin-card rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 ${compact ? "p-5" : "p-6 md:p-8"} flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}
    >
      <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
        <Lightbulb size={24} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <h2 id={`sugira-${location}`} className="text-lg font-semibold text-gray-900 dark:text-white">
          Qual dúvida você quer ver respondida aqui?
        </h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Mande um tema sobre site, tráfego pago, dados ou segurança. Os mais pedidos viram post.
        </p>
      </div>
      <Link
        to={suggestionHref(pathname)}
        onClick={() => trackEvent("suggestion_link_click", { link_location: location })}
        className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-gray-950 px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        Sugira um tema <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
