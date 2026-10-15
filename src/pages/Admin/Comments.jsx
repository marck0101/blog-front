import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, ExternalLink, MessageSquare, Reply, Trash2, X } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import ConfirmDialog from "../../components/ConfirmDialog";
import CommentsService from "../../services/comments.service";
import { notifyPendingCommentsChanged } from "../../utils/pendingComments";

const TABS = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Recusados" },
];

const formatDate = (d) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function CommentCard({ comment, onStatus, onReply, onDelete, busy }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");

  const sendReply = async (e) => {
    e.preventDefault();
    const ok = await onReply(comment, reply.trim());
    if (ok) {
      setReply("");
      setReplying(false);
    }
  };

  return (
    <li className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-start gap-3">
        {comment.author?.picture ? (
          <img src={comment.author.picture} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 inline-flex items-center justify-center text-sm font-semibold shrink-0">
            {(comment.author?.name || "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{comment.author?.name}</span>
            {comment.isAuthor ? (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Autor</span>
            ) : (
              comment.author?.email && <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">{comment.author.email}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-300">
            {formatDate(comment.createdAt)} · em{" "}
            {comment.post ? (
              <a
                href={`/blog/${comment.post.slug}#comentarios`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {comment.post.title} <ExternalLink size={11} />
              </a>
            ) : (
              "post removido"
            )}
          </p>
        </div>
      </div>

      {comment.parent && (
        <p className="text-xs text-gray-500 dark:text-gray-300 border-l-2 pl-3 line-clamp-2">
          Resposta a <strong>{comment.parent.author?.name}</strong>: {comment.parent.body}
        </p>
      )}

      <p className="text-gray-800 dark:text-gray-100 whitespace-pre-line break-words">{comment.body}</p>

      <div className="flex flex-wrap gap-2">
        {comment.status !== "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(comment, "approved")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Check size={15} /> Aprovar
          </button>
        )}
        {comment.status !== "rejected" && !comment.isAuthor && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(comment, "rejected")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <X size={15} /> Recusar
          </button>
        )}
        {!comment.isAuthor && comment.status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setReplying((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <Reply size={15} /> Responder
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(comment)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 ml-auto"
        >
          <Trash2 size={15} /> Excluir
        </button>
      </div>

      {replying && (
        <form onSubmit={sendReply} className="space-y-2">
          <label htmlFor={`reply-${comment._id}`} className="sr-only">Sua resposta</label>
          <textarea
            id={`reply-${comment._id}`}
            className="input"
            rows={3}
            maxLength={2000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Sua resposta aparece na hora, como autor do blog."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReplying(false)} className="px-3 py-1.5 rounded-lg border text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || reply.trim().length < 2}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {comment.status === "pending" ? "Aprovar e responder" : "Responder"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

/**
 * Moderação dos comentários: tudo que o leitor envia entra como pendente e só
 * aparece no post depois de aprovado aqui.
 */
export default function Comments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = TABS.some((t) => t.value === searchParams.get("status")) ? searchParams.get("status") : "pending";
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    () =>
      CommentsService.adminList({ status, page })
        .then((d) => {
          setData(d);
          setError(null);
          notifyPendingCommentsChanged(d.counts.pending);
        })
        .catch(() => setError("Erro ao carregar os comentários.")),
    [status, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (value) => {
    setPage(1);
    setSearchParams(value === "pending" ? {} : { status: value });
  };

  const run = async (action, message) => {
    setBusy(true);
    try {
      await action();
      await load();
      showToast(message);
      return true;
    } catch (err) {
      showToast(err?.response?.data?.error || "Não foi possível concluir", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onStatus = (comment, next) =>
    run(() => CommentsService.setStatus(comment._id, next), next === "approved" ? "Comentário aprovado" : "Comentário recusado");

  const onReply = (comment, body) => run(() => CommentsService.reply(comment._id, body), "Resposta publicada");

  const confirmDelete = async () => {
    const comment = toDelete;
    setToDelete(null);
    await run(() => CommentsService.remove(comment._id), "Comentário excluído");
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir comentário?"
        description="Some do post junto com as respostas que recebeu. Isso não pode ser desfeito."
        confirmText="Excluir"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <main className="admin-content max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquare size={22} /> Comentários
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Leitores entram com Google para comentar. Nada aparece no blog antes da sua aprovação; suas respostas saem na hora.
          </p>
        </div>

        <div role="tablist" className="flex gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => changeTab(tab.value)}
              className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition ${
                status === tab.value
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {tab.label}
              {data && <span className="ml-1.5 text-xs tabular-nums opacity-70">({data.counts[tab.value]})</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && <p className="text-gray-400">Carregando...</p>}

        {data && data.comments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300 py-6 text-center">
            {status === "pending" ? "Nenhum comentário esperando aprovação." : "Nada por aqui."}
          </p>
        )}

        {data && data.comments.length > 0 && (
          <ul className="space-y-3">
            {data.comments.map((comment) => (
              <CommentCard
                key={comment._id}
                comment={comment}
                busy={busy}
                onStatus={onStatus}
                onReply={onReply}
                onDelete={setToDelete}
              />
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">
              Anterior
            </button>
            <span className="tabular-nums text-gray-500 dark:text-gray-300">
              {page} de {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-300">
          Você recebe um email a cada comentário novo. O email do leitor só aparece aqui no painel, nunca no blog.{" "}
          <Link to="/admin/metrics" className="underline">Ver métricas de engajamento</Link>.
        </p>
      </main>
    </>
  );
}
