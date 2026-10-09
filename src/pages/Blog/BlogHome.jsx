import BlogLayout from "../../layouts/BlogLayout";
import authorPhoto from "../../assets/author.webp";
import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../../components/PostCard";
import PostCardSkeleton from "../../components/PostCardSkeleton";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import SEO from "../../components/SEO";
import { BlogSchema } from "../../components/StructuredData";
import { AUTHOR_NAME, PORTFOLIO_URL } from "../../seo/site";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import SubscribeForm from "../../components/SubscribeForm";
import { useState } from "react";

const POSTS_PER_PAGE = 12;

export default function BlogHome() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Fonte de verdade: array de categorias ativas, suporta múltiplos valores
  // URL: /blog?categoria=tecnologia&categoria=design
  const activeCategories = searchParams.getAll("categoria");
  // Página atual na URL (/blog?pagina=2) — trocar filtro volta para a 1
  const page = Math.max(1, parseInt(searchParams.get("pagina")) || 1);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  const isFirst = useRef(true);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Scroll suave para #posts quando filtro muda (não no mount inicial)
  const catsKey = activeCategories.join(",");
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    document.getElementById("posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [catsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

    PostsService.getPublished(page, POSTS_PER_PAGE, { categories: activeCategories, search })
      .then(({ posts: data, totalPages: pages }) => {
        if (!mounted) return;
        setPosts(data.map(normalizePost));
        setTotalPages(pages || 1);
      })
      .catch(() => {
        if (mounted) {
          setPosts([]);
          showToast("Erro ao carregar posts", "error");
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [catsKey, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Chip clicado → toggle no array, atualiza URL com múltiplos params
  const handleCategoryChange = (newCats) => {
    if (!newCats || newCats.length === 0) {
      setSearchParams({});
      return;
    }
    const params = new URLSearchParams();
    newCats.forEach((cat) => params.append("categoria", cat));
    setSearchParams(params);
  };

  // O FilterBar chama onSearch("") ao montar; só volta para a página 1 se o termo mudou
  const handleSearch = (val) => {
    if (val === search) return;
    setSearch(val);
    if (searchParams.has("pagina")) {
      const params = new URLSearchParams(searchParams);
      params.delete("pagina");
      setSearchParams(params);
    }
  };

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set("pagina", String(p));
    else params.delete("pagina");
    setSearchParams(params);
    document.getElementById("posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch("");
  };

  // Labels das categorias ativas (para título dinâmico e empty state)
  const activeCatLabels = activeCategories
    .map((slug) => categories.find((c) => c.slug === slug)?.label || slug)
    .filter(Boolean);

  return (
    <BlogLayout>
      <SEO url="/blog" />
      <BlogSchema posts={posts} />

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
            <p className="mt-4 text-base text-gray-500 dark:text-gray-300 leading-relaxed max-w-xl">
              Estratégias de tráfego pago, growth e marketing digital para quem
              quer resultados reais. Por{" "}
              <a
                href={PORTFOLIO_URL}
                rel="author"
                className="font-medium text-gray-700 dark:text-gray-200 hover:underline"
              >
                {AUTHOR_NAME}
              </a>
              .
            </p>
            <a
              href="#posts"
              className="mt-6 inline-flex items-center px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Ver todos os posts
            </a>
          </div>

          <img
            src={authorPhoto}
            alt={AUTHOR_NAME}
            width={128}
            height={128}
            className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full object-cover object-top shadow-lg"
          />
        </div>
      </section>

      {/* Posts */}
      <main id="posts" className="max-w-5xl mx-auto px-6 py-10">

        {/* Título dinâmico — só quando 1 categoria ativa */}
        {activeCategories.length === 1 && activeCatLabels[0] && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Posts sobre {activeCatLabels[0]}
          </h2>
        )}

        {/* Chips de categoria — multiSelect para acumulação */}
        {categories.length > 0 && (
          <div className="mb-4">
            <FilterChips
              options={categories}
              selected={activeCategories}
              onChange={handleCategoryChange}
              allLabel="Todas as categorias"
              multiSelect={true}
            />
          </div>
        )}

        {/* Busca */}
        <div className="mb-6">
          <FilterBar
            onSearch={handleSearch}
            showDateRange={false}
            onClear={clearFilters}
            searchPlaceholder="Buscar artigo..."
          />
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <EmptyState
            title={
              activeCategories.length === 1
                ? `Nenhum post sobre ${activeCatLabels[0]} ainda`
                : activeCategories.length > 1
                ? "Nenhum post para os filtros selecionados"
                : "Nenhum post encontrado"
            }
            description={
              activeCategories.length > 0
                ? "Confira outras categorias!"
                : "Tente outros filtros ou aguarde novos artigos."
            }
          />
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {!loading && (
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} className="mt-10" />
        )}

        <div id="assinar" className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
