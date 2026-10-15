import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, MessageSquare, Reply, Trash2 } from "lucide-react";
import CommentsService from "../../services/comments.service";
import authorPhoto from "../../assets/author.webp";
import { AUTHOR_NAME } from "../../seo/site";
import { trackEvent } from "../../utils/analytics";

const BODY_MAX = 2000;

// Rascunho sobrevive à ida e volta do login com Google
const draftKey = (slug) => `comment-draft:${slug}`;
function readDraft(slug) {
  try {
    return JSON.parse(sessionStorage.getItem(draftKey(slug)) || "null") || { body: "", parentId: null };
  } catch {
    return { body: "", parentId: null };
  }
}
function saveDraft(slug, draft) {
  try {
    if (draft.body) sessionStorage.setItem(draftKey(slug), JSON.stringify(draft));
    else sessionStorage.removeItem(draftKey(slug));
  } catch {
    /* sem sessionStorage */
  }
}

function Avatar({ comment, size = 36 }) {
  const [broken, setBroken] = useState(false);
  const src = comment.isAuthor ? authorPhoto : comment.picture;
  const style = { width: size, height: size };
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={style}
        // Foto do Google não carrega com Referer de outro site
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover object-top bg-gray-100 dark:bg-gray-800"
      />
    );
  }
  return (
    <span
      style={style}
      aria-hidden="true"
      className="shrink-0 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 inline-flex items-center justify-center text-sm font-semibold"
    >
      {(comment.name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function CommentItem({ comment, canReply, onReply, onDelete }) {
  const name = comment.isAuthor ? AUTHOR_NAME : comment.name;
  return (
    <article className="flex gap-3">
      <Avatar comment={comment} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{name}</span>
          {comment.isAuthor && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Autor
            </span>
          )}
          <time dateTime={comment.createdAt} className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </time>
        </p>
        {comment.status === "pending" && (
          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Aguardando aprovação · só você está vendo
          </p>
        )}
        {/* Texto puro: o React escapa tudo; quebras de linha preservadas */}
        <p className="mt-1 text-gray-700 dark:text-gray-200 whitespace-pre-line break-words">{comment.body}</p>
        <div className="mt-1 flex gap-3 text-xs">
          {canReply && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Reply size={13} /> Responder
            </button>
          )}
          {comment.mine && (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 size={13} /> Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Comentários do post. Entrar = login com Google (a página vai e volta);
 * comentário novo só aparece para todos depois de aprovado no painel.
 */
export default function Comments({ post }) {
  const [config, setConfig] = useState(null); // { enabled, reader }
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState(() => readDraft(post.slug));
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok" | "error", text }
  const sectionRef = useRef(null);
  const textareaRef = useRef(null);
  const reader = config?.reader;

  useEffect(() => {
    let active = true;
    Promise.all([CommentsService.me().catch(() => ({ enabled: false, reader: null })), CommentsService.list(post._id).catch(() => [])])
      .then(([me, list]) => {
        if (!active) return;
        setConfig(me);
        setComments(list);
      });

    // Voltou do Google com erro
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "erro") {
      setNotice({ type: "error", text: "Não foi possível entrar com o Google. Tente de novo." });
      params.delete("login");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }
    return () => {
      active = false;
    };
  }, [post._id]);

  // #comentarios na URL (volta do login): rola até aqui quando a seção carrega
  useEffect(() => {
    if (config && window.location.hash === "#comentarios") {
      sectionRef.current?.scrollIntoView({ block: "start" });
      if (reader) textareaRef.current?.focus({ preventScroll: true });
    }
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => saveDraft(post.slug, draft), [post.slug, draft]);

  // Principais em ordem, cada um com suas respostas
  const threads = useMemo(() => {
    const top = comments.filter((c) => !c.parent);
    return top.map((c) => ({ ...c, replies: comments.filter((r) => String(r.parent) === String(c.id)) }));
  }, [comments]);

  const approvedCount = comments.filter((c) => c.status === "approved").length;
  const replyingTo = draft.parentId ? comments.find((c) => String(c.id) === String(draft.parentId)) : null;

  // Sem login disponível e sem comentários: a seção não aparece
  if (!config || (!config.enabled && comments.length === 0)) return null;

  const login = () => {
    saveDraft(post.slug, draft);
    trackEvent("comment_login_start", { post_slug: post.slug });
    window.location.href = CommentsService.loginUrl(`/blog/${post.slug}`);
  };

  const logout = async () => {
    await CommentsService.logout().catch(() => {});
    setConfig((c) => ({ ...c, reader: null }));
    setComments((list) => list.filter((c) => c.status === "approved").map((c) => ({ ...c, mine: false })));
  };

  const startReply = (comment) => {
    setDraft((d) => ({ ...d, parentId: comment.id }));
    setNotice(null);
    textareaRef.current?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = draft.body.trim();
    if (body.length < 2) return;
    setSending(true);
    setNotice(null);
    try {
      const created = await CommentsService.create(post._id, body, draft.parentId);
      setComments((list) => [...list, created]);
      setDraft({ body: "", parentId: null });
      setNotice({ type: "ok", text: "Recebido! Seu comentário aparece para todos depois de aprovado." });
      trackEvent("comment_submit", { post_slug: post.slug, post_category: post.category, is_reply: Boolean(draft.parentId) });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setConfig((c) => ({ ...c, reader: null }));
      setNotice({
        type: "error",
        text: err?.response?.data?.error || err?.response?.data?.message || "Não foi possível enviar. Tente de novo.",
      });
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment) => {
    if (!window.confirm("Excluir seu comentário? Isso não pode ser desfeito.")) return;
    try {
      await CommentsService.removeMine(comment.id);
      setComments((list) => list.filter((c) => c.id !== comment.id && String(c.parent) !== String(comment.id)));
    } catch {
      setNotice({ type: "error", text: "Não foi possível excluir. Tente de novo." });
    }
  };

  return (
    <section
      id="comentarios"
      ref={sectionRef}
      aria-labelledby="comentarios-titulo"
      className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 scroll-mt-20"
    >
      <h2 id="comentarios-titulo" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
        <MessageSquare size={20} />
        Comentários{approvedCount > 0 && <span className="text-gray-500 dark:text-gray-400 font-normal">({approvedCount})</span>}
      </h2>

      {config.enabled && (
        <div className="mt-5">
          {!reader ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                Entre com sua conta Google para comentar. Seu nome e foto aparecem no comentário; o email não.
              </p>
              <button
                type="button"
                onClick={login}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <GoogleMark /> Entrar com Google
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 min-w-0 text-gray-700 dark:text-gray-200">
                  <Avatar comment={{ name: reader.name, picture: reader.picture }} size={28} />
                  <span className="truncate">
                    Comentando como <strong>{reader.name}</strong>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <LogOut size={13} /> Sair
                </button>
              </div>

              {replyingTo && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Respondendo a <strong>{replyingTo.isAuthor ? AUTHOR_NAME : replyingTo.name}</strong> ·{" "}
                  <button type="button" onClick={() => setDraft((d) => ({ ...d, parentId: null }))} className="underline">
                    cancelar
                  </button>
                </p>
              )}

              <label htmlFor="comment-body" className="sr-only">Seu comentário</label>
              <textarea
                id="comment-body"
                ref={textareaRef}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value.slice(0, BODY_MAX) }))}
                rows={4}
                maxLength={BODY_MAX}
                placeholder="O que você achou? Dúvidas e experiências também são bem-vindas."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {draft.body.length}/{BODY_MAX} · comentários passam por aprovação
                </span>
                <button
                  type="submit"
                  disabled={sending || draft.body.trim().length < 2}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {sending ? "Enviando..." : "Enviar comentário"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {notice && (
        <p
          role="status"
          className={`mt-3 text-sm ${notice.type === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {threads.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum comentário ainda. Que tal ser o primeiro?</p>
        )}
        {threads.map((thread) => (
          <div key={thread.id} className="space-y-4">
            <CommentItem
              comment={thread}
              canReply={Boolean(reader) && thread.status === "approved"}
              onReply={startReply}
              onDelete={remove}
            />
            {thread.replies.length > 0 && (
              <div className="ml-6 sm:ml-12 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-4">
                {thread.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} canReply={false} onDelete={remove} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// "G" do Google (cores oficiais) para o botão de login
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
