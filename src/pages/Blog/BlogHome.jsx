import BlogLayout from "../../layouts/BlogLayout";
import { useCallback, useEffect, useState } from "react";
import PostCard from "../../components/PostCard";
import PostCardSkeleton from "../../components/PostCardSkeleton";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import useSEO from "../../hooks/useSEO";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import EmptyState from "../../components/EmptyState";
import SubscribeForm from "../../components/SubscribeForm";

export default function BlogHome() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // filtros
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  useSEO({
    title: "Blog | marck0101",
    description: "Artigos sobre marketing, tecnologia e desenvolvimento",
  });

  /* --- categorias via API --- */
  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const normalizePost = (post) => ({
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    coverImage: post.coverImage || null,
    publishedAt: post.publishedAt || post.createdAt,
  });

  /* --- fetch posts com filtros --- */
  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);

    PostsService.getPublished(1, 20, { categories: selectedCategories, search })
      .then(({ posts: data }) => {
        if (!mounted) return;
        setPosts(data.map(normalizePost));
      })
      .catch(() => {
        if (mounted) {
          setPosts([]);
          showToast("Erro ao carregar posts", "error");
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [selectedCategories, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const changeFilter = (setter) => (val) => setter(val);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearch("");
  };

  return (
    <BlogLayout>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>

        {/* Categoria chips */}
        {categories.length > 0 && (
          <div className="mb-4">
            <FilterChips
              options={categories}
              selected={selectedCategories}
              onChange={changeFilter(setSelectedCategories)}
              allLabel="Todas as categorias"
              multiSelect
            />
          </div>
        )}

        {/* Busca por título */}
        <div className="mb-6">
          <FilterBar
            onSearch={changeFilter(setSearch)}
            showDateRange={false}
            onClear={clearFilters}
            searchPlaceholder="Buscar artigo..."
          />
        </div>

        {/* Posts */}
        {loading && (
          <div className="grid gap-6">
            {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <EmptyState
            title="Nenhum post encontrado"
            description="Tente outros filtros ou aguarde novos artigos."
          />
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
