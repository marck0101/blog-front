import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import PublishToggle from "../../components/PublishToggle";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostSkeleton from "../../components/PostSkeleton";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import { Pencil, Trash, ChevronLeft, ChevronRight } from "lucide-react";

const POSTS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

export default function PostsList() {
  const navigate = useNavigate();

  // dados
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // filtros
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categories, setCategories] = useState([]);

  /* --- categorias via API --- */
  useEffect(() => {
    SubscriberService.getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  /* --- ESC fecha preview --- */
  useEffect(() => {
    if (!previewPost) return;
    const onKey = (e) => { if (e.key === "Escape") setPreviewPost(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewPost]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* --- load posts --- */
  const load = useCallback(() => {
    setLoading(true);
    PostsService.getAll(page, POSTS_PER_PAGE, {
      statusFilter,
      categories: selectedCategories,
      search,
      dateFrom,
      dateTo,
    })
      .then(({ posts: data, total: t, totalPages: tp }) => {
        setPosts(Array.isArray(data) ? data : []);
        setTotal(t);
        setTotalPages(tp);
      })
      .catch(() => {
        setPosts([]);
        showToast("Erro ao carregar posts", "error");
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, selectedCategories, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  /* --- helpers para resetar página ao mudar filtro --- */
  const changeFilter = (setter) => (val) => { setter(val); setPage(1); };

  /* --- actions --- */
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

  const clearFilters = () => {
    setSelectedCategories([]);
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  /* --- render --- */
  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold">Posts</h1>
          {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
        </main>
      </>
    );
  }

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Posts</h1>
          <span className="text-sm text-gray-500">{total} post{total !== 1 ? "s" : ""}</span>
        </div>

        {/* Status chips */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <FilterChips
            options={STATUS_OPTIONS}
            selected={statusFilter}
            onChange={changeFilter(setStatusFilter)}
            allLabel="Todos"
            multiSelect={false}
          />
          <Link
            to="/admin/trash"
            className="px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap
              bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300
              border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 transition"
          >
            Lixeira
          </Link>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-3">
            <FilterChips
              options={categories}
              selected={selectedCategories}
              onChange={changeFilter(setSelectedCategories)}
              allLabel="Todas as categorias"
              multiSelect
            />
          </div>
        )}

        {/* Search + date range */}
        <div className="mb-6">
          <FilterBar
            onSearch={changeFilter(setSearch)}
            showDateRange
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={changeFilter(setDateFrom)}
            onDateToChange={changeFilter(setDateTo)}
            onClear={clearFilters}
            searchPlaceholder="Buscar por título..."
          />
        </div>

        {posts.length === 0 && (
          <EmptyState
            title="Nenhum post encontrado"
            description="Não há posts para os filtros selecionados."
            actionLabel="Criar novo post"
            onAction={() => navigate("/admin/create-post")}
          />
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post?._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
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

                <div onClick={() => setPreviewPost(post)} className="flex-1 cursor-pointer">
                  <h2 className="text-lg font-semibold">{post?.title}</h2>
                  <p className="text-sm text-gray-500">
                    {post?.category} • {new Date(post?.createdAt).toLocaleDateString()}
                  </p>
                  {post?.slug && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                  )}
                </div>

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
            <span className="text-sm text-gray-600 dark:text-gray-300">
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

      {/* Preview modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 max-w-4xl w-full rounded-xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-bold">{previewPost?.title}</h2>
              <button onClick={() => setPreviewPost(null)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="post-content prose prose-sm max-w-none dark:prose-invert text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewPost?.content }}
              />
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
