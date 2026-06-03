import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import PostsService from "../../services/posts.service";
import PublishToggle from "../../components/PublishToggle";
import Header from "../../components/Header";
import PostSkeleton from "../../components/PostSkeleton";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import Select from "../../components/Select";
import { Pencil, Trash, ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 10;

export default function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();

  /* ---------------- TOAST ---------------- */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    PostsService.getAll(page, POSTS_PER_PAGE)
      .then(({ posts: data, total: t, totalPages: tp }) => {
        if (!mounted) return;
        setPosts(Array.isArray(data) ? data : []);
        setTotal(t);
        setTotalPages(tp);
      })
      .catch(() => {
        if (!mounted) return;
        setPosts([]);
        showToast("Erro ao carregar posts", "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [page]);

  /* ---------------- ESC PREVIEW ---------------- */
  useEffect(() => {
    if (!previewPost) return;
    const onKeyDown = (e) => { if (e.key === "Escape") setPreviewPost(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewPost]);

  /* ---------------- ACTIONS ---------------- */
  const handleToggle = async (post) => {
    try {
      setLoadingId(post?._id);
      const newStatus = !post?.published;
      await PostsService.togglePublish(post?._id, newStatus);
      setPosts((prev) =>
        prev.map((p) => p._id === post?._id ? { ...p, published: newStatus } : p)
      );
      showToast(newStatus ? "Post publicado com sucesso" : "Post movido para rascunho");
    } catch {
      showToast("Erro ao alterar status do post", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (post) => {
    try {
      await PostsService.softDelete(post?._id);
      setPosts((prev) => prev.filter((p) => p._id !== post?._id));
      setTotal((t) => t - 1);
      showToast("Post movido para a lixeira");
    } catch {
      showToast("Erro ao mover post para a lixeira", "error");
    }
  };

  /* ---------------- CONFIRM REQUESTS ---------------- */
  const handleToggleRequest = (post) => {
    setConfirmAction({
      title: post?.published ? "Mover para rascunho?" : "Publicar post?",
      description: `Deseja realmente ${post?.published ? "despublicar" : "publicar"} o post "${post?.title}"?`,
      type: "warning",
      confirmText: post?.published ? "Mover para rascunho" : "Publicar",
      onConfirm: () => handleToggle(post),
    });
  };

  const handleDeleteRequest = (post) => {
    setConfirmAction({
      title: "Mover post para a lixeira",
      description: `O post "${post?.title}" será movido para a lixeira.`,
      type: "danger",
      confirmText: "Mover para lixeira",
      onConfirm: () => handleDelete(post),
    });
  };

  /* ---------------- FILTER (aplica na página atual) ---------------- */
  const filteredPosts = posts.filter((post) => {
    if (statusFilter === "published") return post?.published;
    if (statusFilter === "draft") return !post?.published;
    return true;
  });

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold">Posts</h1>
          {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
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
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Posts</h1>
          <span className="text-sm text-gray-500">{total} post{total !== 1 ? "s" : ""} no total</span>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="sm:hidden">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { label: "Todos", value: "all" },
                { label: "Publicados", value: "published" },
                { label: "Rascunhos", value: "draft" },
              ]}
            />
          </div>
          <div className="hidden sm:flex gap-2">
            {[
              { label: "Todos", value: "all" },
              { label: "Publicados", value: "published" },
              { label: "Rascunhos", value: "draft" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => { setStatusFilter(item.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === item.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 && (
          <EmptyState
            title="Nenhum post encontrado"
            description="Não há posts para o filtro selecionado."
            actionLabel="Criar novo post"
            onAction={() => navigate("/admin/create-post")}
          />
        )}

        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <article key={post?._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Imagem */}
                <div
                  onClick={() => setPreviewPost(post)}
                  className="w-full h-40 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer flex items-center justify-center"
                >
                  {post?.coverImage ? (
                    <img src={post?.coverImage} alt={post?.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Sem imagem</span>
                  )}
                </div>

                {/* Conteúdo */}
                <div onClick={() => setPreviewPost(post)} className="flex-1 cursor-pointer">
                  <h2 className="text-lg font-semibold">{post?.title}</h2>
                  <p className="text-sm text-gray-500">
                    {post?.category} • {new Date(post?.createdAt).toLocaleDateString()}
                  </p>
                  {post?.slug && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                  )}
                </div>

                {/* Ações desktop */}
                <div className="hidden sm:flex gap-4">
                  <PublishToggle
                    checked={post?.published}
                    disabled={loadingId === post?._id}
                    onChange={() => handleToggleRequest(post)}
                  />
                  <Link to={`/admin/posts/${post?._id}`}>
                    <Pencil size={16} className="mt-1" />
                  </Link>
                  <button onClick={() => handleDeleteRequest(post)}>
                    <Trash size={16} className="mb-1" />
                  </button>
                </div>
              </div>

              {/* Ações mobile */}
              <div className="flex sm:hidden justify-between mt-4 pt-4 border-t">
                <PublishToggle
                  checked={post?.published}
                  disabled={loadingId === post?._id}
                  onChange={() => handleToggleRequest(post)}
                />
                <div className="flex gap-4">
                  <Link to={`/admin/posts/${post?._id}`}>
                    <Pencil size={16} className="mt-1" />
                  </Link>
                  <button onClick={() => handleDeleteRequest(post)}>
                    <Trash size={16} className="mb-1" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                bg-gray-200 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
                bg-gray-200 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-gray-300 dark:hover:bg-gray-700"
            >
              Próximo <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* PREVIEW MODAL */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 max-w-4xl w-full rounded-xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-bold">{previewPost?.title}</h2>
              <button onClick={() => setPreviewPost(null)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <article className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{previewPost?.content}</ReactMarkdown>
              </article>
            </div>
            <div className="border-t p-4 flex justify-end gap-3">
              <button onClick={() => setPreviewPost(null)} className="px-4 py-2 rounded border">
                Fechar
              </button>
              <button
                onClick={() => navigate(`/admin/posts/${previewPost?._id}`)}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

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
