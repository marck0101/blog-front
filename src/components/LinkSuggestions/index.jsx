import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import ContentMapService from "../../services/contentMap.service";

const MAX_SUGGESTIONS = 5;
// Espera a pessoa parar de digitar antes de perguntar de novo ao servidor
const DEBOUNCE_MS = 800;

const escapeHtml = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Um clique insere o link no texto (R-MAP-06): com texto selecionado, ele vira a
 * âncora; sem seleção, entra uma frase "Leia também" no fim do texto.
 */
function insertSuggestion(editor, suggestion) {
  if (!editor || editor.isDestroyed) return;
  if (!editor.state.selection.empty) {
    editor.chain().focus().setLink({ href: suggestion.url }).run();
    return;
  }
  const html = `<p>Leia também: <a href="${escapeHtml(suggestion.url)}">${escapeHtml(suggestion.title)}</a></p>`;
  editor.chain().focus("end").insertContent(html).run();
}

/** Posts com tags em comum que o texto ainda não linka, logo abaixo do editor */
export default function LinkSuggestions({ editor, postId, tags = [], content = "" }) {
  const [items, setItems] = useState([]);
  const tagsKey = tags.join(",");

  useEffect(() => {
    if (!tagsKey) return;
    let active = true;
    const timer = setTimeout(() => {
      ContentMapService.getLinkSuggestions({ postId, tags: tagsKey.split(","), content })
        .then((list) => active && setItems(list.slice(0, MAX_SUGGESTIONS)))
        .catch(() => active && setItems([]));
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [postId, tagsKey, content]);

  const visible = tagsKey ? items : [];
  if (!visible.length) return null;

  return (
    <section aria-label="Sugestões de link interno" className="rounded-md border border-gray-300 dark:border-gray-700 p-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Links internos sugeridos</h3>
      <p className="mt-0.5 text-xs text-gray-500">
        Posts com tags em comum que este texto ainda não linka. Selecione um trecho e clique para usá-lo como âncora;
        sem seleção, a frase entra no fim do texto.
      </p>
      <ul className="mt-2 space-y-1">
        {visible.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              // onMouseDown: não tira o foco (e a seleção) do editor antes do clique
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSuggestion(editor, s)}
              className="w-full flex items-center gap-2 rounded-lg border bg-white dark:bg-gray-950 dark:border-gray-700 px-3 py-2 text-left text-sm hover:border-blue-400 dark:text-gray-100"
            >
              <Link2 size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
              <span className="flex-1 min-w-0 truncate">{s.title}</span>
              <span className="text-xs text-gray-500 shrink-0">
                {s.sharedTags.length} {s.sharedTags.length === 1 ? "tag em comum" : "tags em comum"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
