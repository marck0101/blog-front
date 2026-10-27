import { useEffect } from "react";
import { X } from "lucide-react";
import PostFaq from "../PostFaq";
import { AUTHOR_NAME } from "../../seo/site";
import { readingMinutes } from "../../utils/readingTime";

/**
 * Prévia do post em tela cheia, montada como a página pública (src/pages/Blog/Post.jsx):
 * título, autor, categoria, data, tempo de leitura, texto e FAQ.
 * `actions` entra na barra do topo (ex.: botão Editar na lista de posts).
 */
export default function PostPreview({ post, categoryLabel, onClose, actions = null }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // A página de trás não rola junto
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // "YYYY-MM-DD" do formulário seria meia-noite UTC (dia anterior no Brasil)
  const raw = post.publishedAt || post.plannedAt || new Date();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-gray-950" role="dialog" aria-modal="true" aria-label="Pré-visualização do post">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b bg-white/95 dark:bg-gray-950/95 shrink-0">
        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">Pré-visualização · como o leitor vai ver</p>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <button type="button" onClick={onClose} aria-label="Fechar pré-visualização" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <article className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{post.title || "Sem título"}</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-2">
            Por <span className="font-medium dark:text-gray-100">{AUTHOR_NAME}</span>
            {" "}• {categoryLabel || "Sem categoria"}
            {" "}• <time>{new Date(date).toLocaleDateString("pt-BR")}</time>
            {" "}• {readingMinutes(post.content)} min de leitura
          </p>
          <div
            className="post-content prose prose-lg max-w-none mt-8 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content || "<p><em>Sem conteúdo ainda.</em></p>" }}
          />
          <PostFaq post={post} />
        </article>
      </div>
    </div>
  );
}
