import { List } from "lucide-react";
import { trackEvent } from "../utils/analytics";
import { authorNumbered, tocItems } from "../utils/headings";

// Sumário "Neste post" antes do texto: os intertítulos principais (h2) com link
// para a âncora. Começa aberto (igual ao HTML do prerender, sem a página pular);
// o leitor fecha se quiser.
export default function PostToc({ headings, postSlug }) {
  const items = tocItems(headings);
  if (!items.length) return null;

  return (
    <nav
      aria-label="Sumário do post"
      className="skin-toc mt-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40"
    >
      <details open>
        <summary className="cursor-pointer select-none px-5 py-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
          <List size={18} aria-hidden="true" />
          Neste post
          <span className="font-normal text-sm text-gray-500 dark:text-gray-400">
            ({items.length} seções)
          </span>
        </summary>
        <ol className={`px-5 pb-4 space-y-1.5 ${authorNumbered(items) ? "list-none" : "list-decimal list-inside marker:text-gray-400"}`}>
          {items.map((h, i) => (
            <li key={h.id} className="text-gray-700 dark:text-gray-300">
              <a
                href={`#${h.id}`}
                onClick={() => trackEvent("toc_click", { post_slug: postSlug, position: i + 1 })}
                className="hover:underline hover:text-blue-700 dark:hover:text-blue-300"
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
