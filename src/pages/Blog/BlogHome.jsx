import BlogLayout from "../../layouts/BlogLayout";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../../components/PostCard";
import PostCardSkeleton from "../../components/PostCardSkeleton";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import SEO from "../../components/SEO";
import { BlogSchema } from "../../components/StructuredData";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import EmptyState from "../../components/EmptyState";
import SubscribeForm from "../../components/SubscribeForm";

export default function BlogHome() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Categoria ativa vem sempre da URL — fonte de verdade única
  const activeCategory = searchParams.get("categoria") || "";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  // Controla se é o primeiro render (não rola na carga inicial)
  const isFirst = useRef(true);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Scroll suave para #posts quando a categoria muda por navegação (não no mount)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const el = document.getElementById("posts");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeCategory]);

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

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);

    PostsService.getPublished(1, 20, {
      categories: activeCategory ? [activeCategory] : [],
      search,
    })
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
  }, [activeCategory, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Chip clicado na página → atualiza URL
  const handleCategoryChange = (val) => {
    // val = slug string (FilterChips multiSelect=false)
    if (!val || val === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: val });
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch("");
  };

  const activeCatLabel =
    categories.find((c) => c.slug === activeCategory)?.label || activeCategory;

  return (
    <BlogLayout>
      <SEO
        title="Blog | marck0101"
        description="Artigos sobre marketing digital, tráfego pago e growth."
        url="/blog"
      />
      <BlogSchema />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Hero */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Marketing que converte.
              <br />
              Conteúdo que cresce.
            </h1>
            <p className="mt-4 text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
              Estratégias de tráfego pago, growth e marketing digital para quem
              quer resultados reais.
            </p>
            <a
              href="#posts"
              className="mt-6 inline-flex items-center px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Ver todos os posts
            </a>
          </div>

          <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl md:text-4xl font-bold select-none shadow-lg">
            M
          </div>
        </div>
      </section>

      {/* Posts */}
      <main id="posts" className="max-w-5xl mx-auto px-6 py-10">

        {/* Título dinâmico quando há filtro */}
        {activeCategory && activeCatLabel && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Posts sobre {activeCatLabel}
          </h2>
        )}

        {/* Chips de categoria */}
        {categories.length > 0 && (
          <div className="mb-4">
            <FilterChips
              options={categories}
              selected={activeCategory || "all"}
              onChange={handleCategoryChange}
              allLabel="Todas as categorias"
              multiSelect={false}
            />
          </div>
        )}

        {/* Busca */}
        <div className="mb-6">
          <FilterBar
            onSearch={(val) => setSearch(val)}
            showDateRange={false}
            onClear={clearFilters}
            searchPlaceholder="Buscar artigo..."
          />
        </div>

        {loading && (
          <div className="grid gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <EmptyState
            title={
              activeCategory
                ? `Nenhum post sobre ${activeCatLabel} ainda`
                : "Nenhum post encontrado"
            }
            description={
              activeCategory
                ? "Confira outras categorias!"
                : "Tente outros filtros ou aguarde novos artigos."
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <div className="grid gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <div id="assinar" className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
