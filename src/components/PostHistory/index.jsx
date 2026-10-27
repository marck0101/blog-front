import { useEffect, useState } from "react";
import { History, RotateCcw, X } from "lucide-react";
import PostFaq from "../PostFaq";
import ConfirmDialog from "../ConfirmDialog";
import PostsService from "../../services/posts.service";

const FIELD_LABELS = {
  title: "título",
  slug: "endereço",
  excerpt: "resumo",
  content: "conteúdo",
  category: "categoria",
  season: "season",
  seasonOrder: "ordem na season",
  coverImage: "capa",
  coverImageAlt: "alt da capa",
  gallery: "galeria",
  faq: "FAQ",
  seo: "SEO",
};

const reasonLabel = (rev) =>
  ({
    baseline: "Estado antes do histórico",
    create: "Post criado",
    edit: "Edição",
    restore: `Restaurada da v${rev.restoredFrom}`,
    "image-removed": "Imagem removida da galeria",
  })[rev.reason] || "Edição";

const dateTime = (iso) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Histórico de versões do post (v1, v2, v3…), em tela cheia sobre o editor.
 * Lista à esquerda, prévia da versão escolhida à direita. Restaurar cria uma
 * versão nova com aquele conteúdo; nada do histórico é apagado.
 * `dirty`: o editor tem alterações não salvas, que a restauração descarta.
 */
export default function PostHistory({ postId, dirty, onClose, onRestored }) {
  const [revisions, setRevisions] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState({});
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    PostsService.getRevisions(postId)
      .then((list) => {
        setRevisions(list);
        setSelected(list[0]?.version ?? null);
      })
      .catch(() => {
        setRevisions([]);
        setError("Não foi possível carregar o histórico.");
      });
  }, [postId]);

  useEffect(() => {
    if (selected == null || details[selected]) return;
    PostsService.getRevision(postId, selected)
      .then((rev) => setDetails((d) => ({ ...d, [selected]: rev })))
      .catch(() => setError(`Não foi possível carregar a v${selected}.`));
  }, [postId, selected, details]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !confirmRestore && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, confirmRestore]);

  const restore = async () => {
    setConfirmRestore(false);
    setRestoring(true);
    setError("");
    try {
      await PostsService.restoreRevision(postId, selected);
      await onRestored(selected);
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao restaurar a versão.");
    } finally {
      setRestoring(false);
    }
  };

  const latest = revisions?.[0]?.version;
  const current = details[selected];
  const snapshot = current?.snapshot;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-gray-950" role="dialog" aria-modal="true" aria-label="Histórico de versões">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b bg-white/95 dark:bg-gray-950/95 shrink-0">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <History size={16} /> Histórico de versões
        </p>
        <button type="button" onClick={onClose} aria-label="Fechar histórico" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="px-4 sm:px-6 py-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border-b">{error}</p>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* LISTA */}
        <ol className="shrink-0 max-h-56 lg:max-h-none overflow-y-auto border-b lg:border-b-0 lg:border-r divide-y dark:divide-gray-800">
          {revisions === null && <li className="p-4 text-sm text-gray-500">Carregando...</li>}
          {revisions?.length === 0 && !error && (
            <li className="p-4 text-sm text-gray-500 dark:text-gray-300">
              Este post ainda não tem histórico. A primeira versão é guardada no próximo salvamento.
            </li>
          )}
          {revisions?.map((rev, i) => {
            const previous = revisions[i + 1];
            const delta = previous ? rev.summary.images - previous.summary.images : 0;
            const active = rev.version === selected;
            return (
              <li key={rev.version}>
                <button
                  type="button"
                  onClick={() => setSelected(rev.version)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full text-left px-4 py-3 transition ${
                    active ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">v{rev.version}</span>
                    {rev.version === latest && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">atual</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{dateTime(rev.createdAt)}</span>
                  </span>
                  <span className="block text-sm text-gray-700 dark:text-gray-200 mt-0.5">
                    {reasonLabel(rev)}{rev.author?.name ? ` · ${rev.author.name}` : ""}
                  </span>
                  {rev.changes.length > 0 && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Mudou: {rev.changes.map((f) => FIELD_LABELS[f] || f).join(", ")}
                    </span>
                  )}
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {plural(rev.summary.images, "imagem", "imagens")} no texto
                    {delta < 0 && <span className="text-red-600 dark:text-red-400 font-medium"> ({delta})</span>}
                    {delta > 0 && <span className="text-green-700 dark:text-green-400"> (+{delta})</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* PRÉVIA */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {selected != null && (
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur">
              <p className="flex-1 min-w-0 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-mono font-semibold text-gray-900 dark:text-white">v{selected}</span>
                {selected === latest ? " · é o que está salvo agora" : " · como o post estava nesta versão"}
              </p>
              {selected !== latest && (
                <button
                  type="button"
                  onClick={() => setConfirmRestore(true)}
                  disabled={!current || restoring}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  <RotateCcw size={16} /> {restoring ? "Restaurando..." : "Restaurar esta versão"}
                </button>
              )}
            </div>
          )}

          {selected != null && !snapshot && <p className="p-6 text-sm text-gray-500">Carregando versão...</p>}

          {snapshot && (
            <article className="max-w-3xl mx-auto px-6 py-10">
              {snapshot.coverImage && (
                <img src={snapshot.coverImage} alt={snapshot.coverImageAlt || ""} className="w-full rounded-xl mb-8" />
              )}
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{snapshot.title || "Sem título"}</h1>
              {snapshot.excerpt && <p className="mt-3 text-gray-500 dark:text-gray-300">{snapshot.excerpt}</p>}
              <div
                className="post-content prose prose-lg max-w-none mt-8 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: snapshot.content || "<p><em>Sem conteúdo.</em></p>" }}
              />
              <PostFaq post={snapshot} />
            </article>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRestore}
        title={`Restaurar a v${selected}?`}
        description={
          `O texto, as imagens, o FAQ e o SEO voltam a ser os da v${selected}. A versão atual continua no histórico, então dá para voltar atrás. ` +
          "Status, datas, email e endereço do post não mudam." +
          (dirty ? " As alterações não salvas no editor serão descartadas." : "")
        }
        type={dirty ? "danger" : "info"}
        confirmText="Restaurar"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={restore}
      />
    </div>
  );
}
