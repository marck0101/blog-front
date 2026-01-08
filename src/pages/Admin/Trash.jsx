import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import PostsService from "../../services/posts.service";
import Header from "../../components/Header";
import PostSkeleton from "../../components/PostSkeleton";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function Trash() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPost, setPreviewPost] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  /* ---------------- TOAST ---------------- */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    PostsService.listDeleted()
      .then((res) => setPosts(res.data))
      .catch(() => showToast("Erro ao carregar lixeira", "error"))
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- ESC PREVIEW ---------------- */
  useEffect(() => {
    if (!previewPost) return;
    const onKeyDown = (e) => e.key === "Escape" && setPreviewPost(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewPost]);

  /* ---------------- ACTIONS ---------------- */

  const restore = async (post, close = false) => {
    try {
      await PostsService.restore(post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      showToast("Post restaurado com sucesso");
      if (close) setPreviewPost(null);
    } catch {
      showToast("Erro ao restaurar post", "error");
    }
  };

  const remove = async (post, close = false) => {
    try {
      await PostsService.deletePermanent(post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      showToast("Post excluído permanentemente");
      if (close) setPreviewPost(null);
    } catch {
      showToast("Erro ao excluir post", "error");
    }
  };

  /* ---------------- CONFIRM REQUESTS ---------------- */

  const restoreRequest = (post, close = false) => {
    setConfirmAction({
      title: "Restaurar post",
      description: `Deseja restaurar o post "${post.title}"?`,
      type: "info",
      confirmText: "Restaurar",
      onConfirm: () => restore(post, close),
    });
  };

  const removeRequest = (post, close = false) => {
    setConfirmAction({
      title: "Excluir definitivamente",
      description:
        "Essa ação é irreversível. O post será excluído permanentemente.",
      type: "danger",
      confirmText: "Excluir",
      onConfirm: () => remove(post, close),
    });
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold">Lixeira</h1>
          {Array.from({ length: 5 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </main>
      </>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <>
      <Header />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">Lixeira</h1>

        {posts.length === 0 && (
          <EmptyState
            title="Lixeira vazia"
            description="Nenhum post foi excluído até o momento."
          />
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post._id}
              className="group rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Imagem */}
                <div className="w-full h-40 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-70"
                    />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold flex gap-2 items-center">
                    {post.title}
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                      EXCLUÍDO
                    </span>
                  </h2>

                  <p className="text-sm text-gray-500">
                    {post.category} •{" "}
                    {new Date(post.deletedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Ações desktop */}
                <div className="hidden sm:flex gap-4 text-lg">
                  <button onClick={() => setPreviewPost(post)}>👁</button>
                  <button onClick={() => restoreRequest(post)}>↩️</button>
                  <button onClick={() => removeRequest(post)}>❗</button>
                </div>
              </div>

              {/* Ações mobile */}
              <div className="flex sm:hidden justify-between mt-4 pt-4 border-t">
                <button onClick={() => setPreviewPost(post)}>
                  👁 Visualizar
                </button>

                <div className="flex gap-4">
                  <button onClick={() => restoreRequest(post)}>↩️</button>
                  <button onClick={() => removeRequest(post)}>❗</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* PREVIEW */}
        {previewPost && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-900 max-w-4xl w-full rounded-xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex justify-between">
                <h2 className="font-bold">{previewPost.title}</h2>
                <button onClick={() => setPreviewPost(null)}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <article className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{previewPost.content}</ReactMarkdown>
                </article>
              </div>

              <div className="border-t p-4 flex justify-between">
                <button onClick={() => setPreviewPost(null)}>Fechar</button>

                <div className="flex gap-3">
                  <button
                    onClick={() => restoreRequest(previewPost, true)}
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                  >
                    Restaurar
                  </button>

                  <button
                    onClick={() => removeRequest(previewPost, true)}
                    className="px-4 py-2 rounded bg-red-600 text-white"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        description={confirmAction?.description}
        type={confirmAction?.type}
        confirmText={confirmAction?.confirmText}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          confirmAction.onConfirm();
          setConfirmAction(null);
        }}
      />
    </>
  );
}
