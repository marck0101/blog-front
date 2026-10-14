import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import PublishToggle from "../../components/PublishToggle";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostSkeleton from "../../components/PostSkeleton";
import EmptyState from "../../components/EmptyState";
import PostStatusBadge from "../../components/PostStatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import ViewToggle from "../../components/ViewToggle";
import useViewMode from "../../hooks/useViewMode";
import usePageSize from "../../hooks/usePageSize";
import Pagination from "../../components/Pagination";
import { Pencil, Trash } from "lucide-react";

const PAGE_SIZES = [5, 10, 20, 50];

// Contêiner de cada formato de visualização
const LAYOUT = {
  list: "space-y-4",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  compact: "rounded-xl border bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800",
};

const STATUS_OPTIONS = [
  { value: "published", label: "Publicados" },
  { value: "planned", label: "Agendados" },
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
  // ?status=draft vem dos cards do Dashboard
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() =>
    ["published", "planned", "draft"].includes(searchParams.get("status")) ? searchParams.get("status") : "all"
  );
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categories, setCategories] = useState([]);
  const [pageSize, setPageSize] = usePageSize("admin-posts-page-size", PAGE_SIZES, 10);
  const [view, setView] = useViewMode("admin-posts-view", ["list", "grid", "compact"], "list");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [seasons, setSeasons] = useState([]);

  // seleção em massa (ids da página atual)
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkSeason, setBulkSeason] = useState("");

  const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.label || slug;

  /* --- categorias via API --- */
  useEffect(() => {
    SubscriberService.getCategories()
      .then(setCategories)
      .catch(() => {});
    PostsService.getSeasons()
      .then(setSeasons)
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
    PostsService.getAll(page, pageSize, {
      statusFilter,
      categories: selectedCategories,
      season: selectedSeason === "all" ? "" : selectedSeason,
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
  }, [page, pageSize, statusFilter, selectedCategories, selectedSeason, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Trocou de página/filtro: a seleção (que é da página) recomeça
  const [selectionKey, setSelectionKey] = useState("");
  const currentKey = posts.map((p) => p._id).join(",");
  if (currentKey !== selectionKey) {
    setSelectionKey(currentKey);
    setSelected(new Set());
  }

  const toggleSelected = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = posts.length > 0 && posts.every((p) => selected.has(p._id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(posts.map((p) => p._id)));

  // Uma requisição por post (rotas já existentes); recarrega a lista no fim.
  // Publicar em massa fica de fora de propósito: cada publicação dispara email.
  const runBulk = async (label, action) => {
    const ids = [...selected];
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(action));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkBusy(false);
    setSelected(new Set());
    showToast(
      failed ? `${label}: ${ids.length - failed} ok, ${failed} com erro` : `${label}: ${ids.length} post(s)`,
      failed ? "error" : "success"
    );
    load();
  };

  const bulkRequest = (kind) => {
    const n = selected.size;
    const plural = n !== 1 ? "s" : "";
    const actions = {
      draft: {
        title: `Mover ${n} post${plural} para rascunho?`,
        description: "Publicados saem do ar e agendados deixam de ter publicação automática.",
        confirmText: "Mover para rascunho",
        type: "warning",
        run: () => runBulk("Movidos para rascunho", (id) => PostsService.update(id, { status: "draft" })),
      },
      season: {
        title: bulkSeason ? `Colocar ${n} post${plural} na season?` : `Tirar ${n} post${plural} da season?`,
        description: bulkSeason
          ? `Season: ${seasons.find((s) => s.slug === bulkSeason)?.label}. O nº do episódio fica em branco para você ordenar depois.`
          : "Os posts deixam de fazer parte de qualquer season.",
        confirmText: "Aplicar",
        type: "info",
        run: () =>
          runBulk("Season atualizada", (id) =>
            PostsService.update(id, { season: bulkSeason || null, seasonOrder: null })
          ),
      },
      trash: {
        title: `Mover ${n} post${plural} para a lixeira?`,
        description: "Dá para restaurar depois pela Lixeira.",
        confirmText: "Mover para lixeira",
        type: "danger",
        run: () => runBulk("Movidos para a lixeira", (id) => PostsService.softDelete(id)),
      },
    };
    const a = actions[kind];
    setConfirmAction({ ...a, onConfirm: a.run });
  };

  /* --- helpers para resetar página ao mudar filtro --- */
  const changeFilter = (setter) => (val) => { setter(val); setPage(1); };

  /* --- actions --- */
  const handleToggle = async (post) => {
    try {
      setLoadingId(post?._id);
      const newStatus = !post?.published;
      const updated = await PostsService.togglePublish(post?._id, newStatus);
      setPosts((prev) =>
        prev.map((p) => p._id === post?._id ? { ...p, ...updated } : p)
      );
      showToast(newStatus ? "Post publicado com sucesso" : "Post movido para rascunho");
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao alterar status do post", "error");
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
      description: post?.published
        ? `O post "${post?.title}" sai do ar e volta para rascunho.`
        : `O post "${post?.title}" vai ao ar agora${post?.status === "planned" ? ", antes da data agendada" : ""}.`,
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
        <div className="mb-3">
          <FilterChips
            options={STATUS_OPTIONS}
            selected={statusFilter}
            onChange={changeFilter(setStatusFilter)}
            allLabel="Todos"
            multiSelect={false}
          />
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

        {/* Season chips */}
        {seasons.length > 0 && (
          <div className="mb-3">
            <FilterChips
              options={seasons}
              selected={selectedSeason}
              onChange={changeFilter(setSelectedSeason)}
              allLabel="Todas as seasons"
              multiSelect={false}
            />
          </div>
        )}

        {/* Search + date range + formato */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex-1 min-w-0">
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
          <ViewToggle value={view} onChange={setView} modes={["list", "grid", "compact"]} />
        </div>

        {!loading && posts.length === 0 && (
          <EmptyState
            title="Nenhum post encontrado"
            description="Não há posts para os filtros selecionados."
            actionLabel="Criar novo post"
            onAction={() => navigate("/admin/create-post")}
          />
        )}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 min-h-[2.5rem]">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
              {selected.size > 0 ? `${selected.size} selecionado(s)` : "Selecionar todos da página"}
            </label>
            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={bulkBusy} onClick={() => bulkRequest("draft")}
                  className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                  Mover para rascunho
                </button>
                <span className="flex items-center gap-1">
                  <select aria-label="Season para os selecionados" value={bulkSeason} onChange={(e) => setBulkSeason(e.target.value)}
                    className="input !w-auto !py-1.5 text-sm">
                    <option value="">Sem season</option>
                    {seasons.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                  </select>
                  <button type="button" disabled={bulkBusy} onClick={() => bulkRequest("season")}
                    className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
                    Aplicar season
                  </button>
                </span>
                <button type="button" disabled={bulkBusy} onClick={() => bulkRequest("trash")}
                  className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                  Mover para lixeira
                </button>
                {bulkBusy && <span className="text-sm text-gray-500">Aplicando...</span>}
              </div>
            )}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className={LAYOUT[view]}>
            {posts.map((post) => {
              const actions = (
                <>
                  <PublishToggle
                    post={post}
                    disabled={loadingId === post?._id}
                    onChange={() => handleToggleRequest(post)}
                  />
                  <Link to={`/admin/posts/${post?._id}`} aria-label="Editar" title="Editar">
                    <Pencil size={16} className="mt-1" />
                  </Link>
                  <button onClick={() => handleDeleteRequest(post)} aria-label="Mover para a lixeira" title="Mover para a lixeira">
                    <Trash size={16} className="mb-1" />
                  </button>
                </>
              );
              const cover = post?.coverImage ? (
                <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">Sem imagem</span>
              );
              const meta = `${categoryLabel(post?.category)} • ${new Date(post?.createdAt).toLocaleDateString("pt-BR")}`;
              const checkbox = (
                <input
                  type="checkbox"
                  aria-label={`Selecionar "${post?.title}"`}
                  checked={selected.has(post?._id)}
                  onChange={() => toggleSelected(post?._id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-blue-600 shrink-0 cursor-pointer"
                />
              );

              if (view === "compact") {
                return (
                  <div key={post?._id} className="flex items-center gap-3 px-4 py-2.5">
                    {checkbox}
                    <button
                      type="button"
                      onClick={() => setPreviewPost(post)}
                      className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-left"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <PostStatusBadge post={post} />
                        <span className="truncate font-medium text-gray-900 dark:text-gray-100">{post?.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-300">{meta}</span>
                    </button>
                    <div className="flex items-center gap-4 shrink-0">{actions}</div>
                  </div>
                );
              }

              if (view === "grid") {
                return (
                  <article key={post?._id} className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
                    <div
                      onClick={() => setPreviewPost(post)}
                      className="aspect-video bg-gray-100 dark:bg-gray-800 cursor-pointer flex items-center justify-center"
                    >
                      {cover}
                    </div>
                    <div onClick={() => setPreviewPost(post)} className="p-4 flex-1 cursor-pointer space-y-1.5">
                      <div className="flex items-center gap-2">{checkbox}<PostStatusBadge post={post} /></div>
                      <h2 className="font-semibold leading-snug line-clamp-2">{post?.title}</h2>
                      <p className="text-sm text-gray-500">{meta}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t">{actions}</div>
                  </article>
                );
              }

              return (
                <article key={post?._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    {checkbox}
                    <div
                      onClick={() => setPreviewPost(post)}
                      className="w-full h-40 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer flex items-center justify-center"
                    >
                      {cover}
                    </div>

                    <div onClick={() => setPreviewPost(post)} className="flex-1 cursor-pointer">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold">{post?.title}</h2>
                        <PostStatusBadge post={post} className="mt-1" />
                      </div>
                      <p className="text-sm text-gray-500">{meta}</p>
                      {post?.slug && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                      )}
                    </div>

                    <div className="hidden sm:flex gap-4">{actions}</div>
                  </div>

                  <div className="flex sm:hidden justify-between mt-4 pt-4 border-t">{actions}</div>
                </article>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          total={total}
          className="mt-8"
        />
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
