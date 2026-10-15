import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PostsService from "../../services/posts.service";
import AudiencesService from "../../services/audiences.service";
import SubscriberService from "../../services/subscriber.service";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostSkeleton from "../../components/PostSkeleton";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import TypedConfirmDialog from "../../components/TypedConfirmDialog";
import { POST_STATUS, postStatusKey } from "../../utils/postStatus";
import { Eye, RotateCcw, Trash2, Users } from "lucide-react";

// Status que o post tinha antes de ir para a lixeira
const previousKey = (post) => postStatusKey({ ...post, deletedAt: null });

// Abas da lixeira: ?tipo=publicos mostra os públicos; sem parâmetro, os posts
const TABS = [
  { value: "posts", label: "Posts", to: "/admin/trash" },
  { value: "publicos", label: "Públicos", to: "/admin/trash?tipo=publicos" },
];

function TrashTabs({ current }) {
  return (
    <div role="tablist" className="flex gap-1 border-b mb-6">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          to={tab.to}
          role="tab"
          aria-selected={current === tab.value}
          className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition ${
            current === tab.value
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

const num = (n) => (n || 0).toLocaleString("pt-BR");

// Públicos na lixeira: restaurar devolve com as mesmas pessoas
function AudiencesTrash() {
  const [audiences, setAudiences] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // público | { all: true }
  const [busy, setBusy] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(
    () =>
      AudiencesService.getTrash()
        .then(setAudiences)
        .catch(() => {
          setAudiences([]);
          showToast("Erro ao carregar a lixeira", "error");
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (audience) => {
    try {
      await AudiencesService.restore(audience._id);
      setAudiences((prev) => prev.filter((a) => a._id !== audience._id));
      showToast(`"${audience.name}" voltou para Públicos`);
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao restaurar", "error");
    }
  };

  const remove = async (target) => {
    const targets = target.all ? audiences : [target];
    setBusy(true);
    const results = await Promise.allSettled(targets.map((a) => AudiencesService.deletePermanent(a._id)));
    setBusy(false);
    const removedIds = new Set(targets.filter((_, i) => results[i].status === "fulfilled").map((a) => a._id));
    setAudiences((prev) => prev.filter((a) => !removedIds.has(a._id)));
    const failed = results.find((r) => r.status === "rejected");
    showToast(
      failed
        ? failed.reason?.response?.data?.error || `${removedIds.size} excluído(s), com erro nos demais`
        : target.all
        ? "Públicos da lixeira excluídos"
        : "Público excluído de vez",
      failed ? "error" : "success"
    );
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Públicos na lixeira não aparecem nos envios. As pessoas continuam ligadas a eles: restaurar devolve o público completo.
          Excluir de vez desfaz o público, mas mantém as pessoas como assinantes.
        </p>
        {audiences?.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmRemove({ all: true })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            <Trash2 size={16} /> {busy ? "Excluindo..." : `Esvaziar (${audiences.length})`}
          </button>
        )}
      </div>

      {!audiences && <p className="text-gray-400">Carregando...</p>}

      {audiences?.length === 0 && <EmptyState title="Lixeira vazia" description="Nenhum público na lixeira." />}

      <div className="space-y-3">
        {audiences?.map((a) => (
          <article key={a._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Users size={20} className="shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold">{a.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {num(a.active)} ativo(s)
                {a.total > a.active && <> · {num(a.total - a.active)} cancelado(s)</>} · na lixeira desde{" "}
                {new Date(a.deletedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmRestore(a)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-600 text-green-700 dark:border-green-500 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <RotateCcw size={15} /> Restaurar
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(a)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={15} /> Excluir de vez
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmRestore}
        title="Restaurar público"
        description={`"${confirmRestore?.name}" volta para Públicos com as mesmas pessoas.`}
        type="info"
        confirmText="Restaurar"
        onCancel={() => setConfirmRestore(null)}
        onConfirm={() => {
          restore(confirmRestore);
          setConfirmRestore(null);
        }}
      />

      <TypedConfirmDialog
        open={!!confirmRemove}
        title={confirmRemove?.all ? `Excluir de vez ${audiences?.length} público(s)?` : "Excluir de vez?"}
        description={
          confirmRemove?.all
            ? "Os públicos da lixeira serão apagados. As pessoas continuam como assinantes. Não dá para desfazer."
            : `"${confirmRemove?.name}" será apagado. As pessoas continuam como assinantes. Não dá para desfazer.`
        }
        confirmText={confirmRemove?.all ? "Esvaziar" : "Excluir de vez"}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          remove(confirmRemove);
          setConfirmRemove(null);
        }}
      />
    </>
  );
}

export default function Trash() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("tipo") === "publicos") {
    return (
      <>
        <SEO robots="noindex, nofollow" />
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
          <h1 className="text-2xl font-bold mb-4">Lixeira</h1>
          <TrashTabs current="publicos" />
          <AudiencesTrash />
        </main>
      </>
    );
  }
  return <PostsTrash />;
}

function PostsTrash() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null); // { post, close }
  const [confirmRemove, setConfirmRemove] = useState(null); // { post, close } | { all: true }
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      setPosts(await PostsService.getTrash());
    } catch {
      showToast("Erro ao carregar a lixeira", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, [loadTrash]);

  useEffect(() => {
    if (!previewPost) return;
    const onKeyDown = (e) => e.key === "Escape" && setPreviewPost(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewPost]);

  const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.label || slug;

  // Restaurar sempre volta como rascunho: um post publicado não volta ao ar sozinho
  const restore = async ({ post, close }) => {
    try {
      await PostsService.restore(post._id);
      await PostsService.togglePublish(post._id, false);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      showToast("Post restaurado como rascunho");
      if (close) setPreviewPost(null);
    } catch {
      showToast("Erro ao restaurar post", "error");
    }
  };

  const remove = async (target) => {
    const targets = target.all ? posts : [target.post];
    setBusy(true);
    const results = await Promise.allSettled(targets.map((p) => PostsService.deletePermanent(p._id)));
    setBusy(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const removedIds = new Set(targets.filter((_, i) => results[i].status === "fulfilled").map((p) => p._id));
    setPosts((prev) => prev.filter((p) => !removedIds.has(p._id)));
    if (target.close) setPreviewPost(null);
    showToast(
      failed ? `${removedIds.size} excluído(s), ${failed} com erro` :
      target.all ? "Lixeira esvaziada" : "Post excluído permanentemente",
      failed ? "error" : "success"
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold">Lixeira</h1>
          <TrashTabs current="posts" />
          {Array.from({ length: 5 }).map((_, index) => <PostSkeleton key={index} />)}
        </main>
      </>
    );
  }

  const actions = (post, close = false) => (
    <>
      <button
        type="button"
        onClick={() => setConfirmRestore({ post, close })}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-600 text-green-700 dark:border-green-500 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20"
      >
        <RotateCcw size={15} /> Restaurar
      </button>
      <button
        type="button"
        onClick={() => setConfirmRemove({ post, close })}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Trash2 size={15} /> Excluir de vez
      </button>
    </>
  );

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-4">Lixeira</h1>
        <TrashTabs current="posts" />
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Não há exclusão automática: os posts ficam aqui até você excluir. Restaurar devolve como rascunho.
            </p>
          </div>
          {posts.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmRemove({ all: true })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <Trash2 size={16} /> {busy ? "Excluindo..." : `Esvaziar lixeira (${posts.length})`}
            </button>
          )}
        </div>

        {posts.length === 0 && (
          <EmptyState title="Lixeira vazia" description="Nenhum post na lixeira." />
        )}

        <div className="space-y-4">
          {posts.map((post) => {
            const prev = POST_STATUS[previousKey(post)];
            return (
              <article key={post._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="w-full h-40 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" className="w-full h-full object-cover opacity-70" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                      <span title="Status antes de ir para a lixeira" className={`text-xs px-1.5 py-0.5 rounded font-medium ${prev.style}`}>
                        era {prev.label}
                      </span>
                      <span>{categoryLabel(post.category)}</span>
                      <span>• na lixeira desde {new Date(post.deletedAt).toLocaleDateString("pt-BR")}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewPost(post)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Eye size={15} /> Ver
                    </button>
                    {actions(post)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {previewPost && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-900 max-w-4xl w-full rounded-xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex justify-between gap-3">
                <h2 className="font-bold">{previewPost.title}</h2>
                <button type="button" onClick={() => setPreviewPost(null)} aria-label="Fechar">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <article
                  className="post-content prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewPost.content || "<p><em>Sem conteúdo.</em></p>" }}
                />
              </div>
              <div className="border-t p-4 flex flex-wrap justify-between gap-3">
                <button type="button" onClick={() => setPreviewPost(null)} className="px-3 py-1.5 text-sm">Fechar</button>
                <div className="flex gap-2">{actions(previewPost, true)}</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!confirmRestore}
        title="Restaurar post"
        description={`"${confirmRestore?.post?.title}" volta para Posts como rascunho.`}
        type="info"
        confirmText="Restaurar"
        onCancel={() => setConfirmRestore(null)}
        onConfirm={() => {
          restore(confirmRestore);
          setConfirmRestore(null);
        }}
      />

      <TypedConfirmDialog
        open={!!confirmRemove}
        title={confirmRemove?.all ? `Esvaziar a lixeira (${posts.length} posts)?` : "Excluir de vez?"}
        description={
          confirmRemove?.all
            ? "Todos os posts da lixeira serão apagados. Não dá para desfazer."
            : `"${confirmRemove?.post?.title}" será apagado. Não dá para desfazer.`
        }
        confirmText={confirmRemove?.all ? "Esvaziar lixeira" : "Excluir de vez"}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          remove(confirmRemove);
          setConfirmRemove(null);
        }}
      />
    </>
  );
}
