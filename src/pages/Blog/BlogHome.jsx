import BlogLayout from "../../layouts/BlogLayout";
import authorPhoto from "../../assets/author.webp";
import { useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PostCard from "../../components/PostCard";
import PostCardSkeleton from "../../components/PostCardSkeleton";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import SEO from "../../components/SEO";
import { BlogSchema } from "../../components/StructuredData";
import { AUTHOR_NAME, PORTFOLIO_URL, BLOG_FAQ } from "../../seo/site";
import PostFaq from "../../components/PostFaq";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import SeasonsService from "../../services/seasons.service";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import ViewToggle from "../../components/ViewToggle";
import useViewMode from "../../hooks/useViewMode";
import usePageSize from "../../hooks/usePageSize";
import SubscribeForm from "../../components/SubscribeForm";
import SeasonCard from "../../components/SeasonCard";
import { setPageContext, trackEvent } from "../../utils/analytics";
import { useState } from "react";
import { Flame, Pin } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";
import GeneratedCover from "../../components/GeneratedCover";

// Múltiplos de 3: a grade tem 3 colunas e as linhas ficam completas
const PAGE_SIZES = [6, 12, 24, 48];

// Ordem da lista: valor na URL (?ordem=) → valor da API. "recentes" é o padrão
// e não aparece na URL.
const SORTS = [
  { value: "recentes", api: "recent", label: "Mais recentes" },
  { value: "antigos", api: "oldest", label: "Mais antigos" },
  { value: "populares", api: "popular", label: "Mais lidos" },
  { value: "az", api: "az", label: "Título (A–Z)" },
];

// Contêiner de cada formato de visualização
const LAYOUT = {
  grid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8",
  list: "space-y-6",
  compact: "divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800",
};

// Destaques da semana: ranking numerado, compacto, para não competir com os fixados
function WeeklyHighlights({ posts, categories }) {
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {posts.map((post, i) => {
        const categoryLabel = categories.find((c) => c.slug === post.category)?.label;
        const cover = normalizeImageUrl(post.coverImage);
        return (
          <li key={post._id}>
            <Link
              to={`/blog/${post.slug}`}
              onClick={() => trackEvent("highlight_click", { post_slug: post.slug, position: i + 1 })}
              className="group flex items-center gap-4 rounded-xl p-2 -m-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <span className="shrink-0 w-8 text-3xl font-bold text-gray-300 dark:text-gray-600 tabular-nums text-center">{i + 1}</span>
              <div className="w-20 shrink-0 aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                {cover ? (
                  <img src={cover} alt={post.coverImageAlt || ""} width={160} height={90} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <GeneratedCover title={post.title} category={post.category} categoryLabel={categoryLabel} size="sm" />
                )}
              </div>
              <div className="min-w-0">
                {categoryLabel && <p className="text-xs text-gray-500 dark:text-gray-300">{categoryLabel}</p>}
                <h3 className="font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export default function BlogHome() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Fonte de verdade: array de categorias ativas, suporta múltiplos valores
  // URL: /blog?categoria=tecnologia&categoria=design
  const activeCategories = searchParams.getAll("categoria");
  // Página atual na URL (/blog?pagina=2) — trocar filtro volta para a 1
  const page = Math.max(1, parseInt(searchParams.get("pagina")) || 1);
  // Busca na URL (/blog?q=seo): dá para compartilhar e voltar a ela
  const search = searchParams.get("q") || "";
  // Ordem na URL (/blog?ordem=antigos): volta igual ao recarregar ou compartilhar
  const sort = SORTS.find((s) => s.value === searchParams.get("ordem")) || SORTS[0];

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = usePageSize("blog-page-size", PAGE_SIZES, 12);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);
  // Seasons públicas (com episódio publicado): selo "Season" nos cards
  const [seasons, setSeasons] = useState([]);
  const [view, setView] = useViewMode("blog-view", ["grid", "list", "compact"], "grid");
  // Vitrine (só na 1ª página sem filtro): fixados no painel e destaques da semana
  const [pinned, setPinned] = useState([]);
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
    SeasonsService.getPublic().then(setSeasons).catch(() => {});
    PostsService.getPinned().then(setPinned).catch(() => {});
    PostsService.getHighlights().then(setHighlights).catch(() => {});
  }, []);

  const catsKey = activeCategories.join(",");

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
    season: post.season || null,
    coverImage: post.coverImage || null,
    publishedAt: post.publishedAt || post.createdAt,
  });

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);

    // Sem filtro, os fixados ficam só na vitrine (em todas as páginas, para a
    // paginação não pular nem repetir posts)
    const excludePinned = activeCategories.length === 0 && !search;
    PostsService.getPublished(page, pageSize, { categories: activeCategories, search, excludePinned, sort: sort.api })
      .then(({ posts: data, totalPages: pages, total }) => {
        if (!mounted) return;
        setPosts(data.map(normalizePost));
        setTotalPages(pages || 1);
        setTotal(total ?? data.length);
        // "search" = evento recomendado do GA4; busca sem resultado = pauta que falta
        if (search && page === 1) {
          trackEvent("search", { search_term: search, results_count: total ?? data.length });
        }
      })
      .catch(() => {
        if (mounted) {
          setPosts([]);
          showToast("Erro ao carregar posts", "error");
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [catsKey, search, page, pageSize, sort.api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPageContext({ page_type: "home" });
  }, []);

  // Link "FAQ" do rodapé (/blog#faq) vindo de outra página: o FAQ fica abaixo da
  // lista, então só rola quando os posts já ocuparam o espaço deles
  useEffect(() => {
    if (loading || window.location.hash !== "#faq") return;
    document.getElementById("faq")?.scrollIntoView();
  }, [loading]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // Chip clicado → toggle no array, atualiza URL com múltiplos params
  const handleCategoryChange = (newCats) => {
    if (newCats?.length) {
      trackEvent("filter_category", { categories: newCats.join(","), categories_count: newCats.length });
    }
    // Troca de categoria mantém a busca e volta para a página 1
    const params = new URLSearchParams();
    (newCats || []).forEach((cat) => params.append("categoria", cat));
    if (search) params.set("q", search);
    if (sort.value !== "recentes") params.set("ordem", sort.value);
    setSearchParams(params);
  };

  // Nova ordem mantém filtros e busca e volta para a página 1
  const changeSort = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === "recentes") params.delete("ordem");
    else params.set("ordem", value);
    params.delete("pagina");
    setSearchParams(params);
    trackEvent("sort_posts", { sort: value });
  };

  // O FilterBar chama onSearch ao montar com o termo atual; só mexe na URL se mudou.
  // replace: cada pausa na digitação não vira uma entrada no histórico
  const handleSearch = (val) => {
    if (val === search) return;
    const params = new URLSearchParams(searchParams);
    if (val) params.set("q", val);
    else params.delete("q");
    params.delete("pagina");
    setSearchParams(params, { replace: true });
  };

  // Novo tamanho volta para a página 1 (a atual pode nem existir mais)
  const changePageSize = (size) => {
    setPageSize(size);
    goToPage(1);
  };

  const goToPage = (p) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) params.set("pagina", String(p));
    else params.delete("pagina");
    setSearchParams(params);
    // Só rola se o topo da lista saiu da tela (paginação fica no fim da lista)
    const list = document.getElementById("posts");
    if (list && list.getBoundingClientRect().top < 0) {
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const changeView = (next) => {
    setView(next);
    trackEvent("change_view", { view_mode: next });
  };

  const clearFilters = () => setSearchParams({});

  const hasActiveFilters = activeCategories.length > 0 || Boolean(search);

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
              href="#assinar"
              onClick={() => trackEvent("newsletter_cta_click", { link_location: "hero" })}
              className="mt-6 inline-flex items-center px-6 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Assinar a newsletter
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

      {/* Fixados: só na primeira página, sem filtro */}
      {pinned.length > 0 && page === 1 && !hasActiveFilters && (
        <section aria-labelledby="fixados" className="max-w-5xl mx-auto px-6 pt-10">
          <h2 id="fixados" className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            <Pin size={20} className="text-amber-600 dark:text-amber-400" /> Comece por aqui
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pinned.map((post) => (
              <PostCard
                key={post._id}
                post={normalizePost(post)}
                badge="Fixado"
                categoryLabel={categories.find((c) => c.slug === post.category)?.label}
                seasonLabel={seasons.find((s) => s.slug === post.season)?.title}
              />
            ))}
          </div>
        </section>
      )}

      {/* Destaques da semana: mais lidos dos últimos 7 dias (+ escolhidos no painel) */}
      {highlights.length > 0 && page === 1 && !hasActiveFilters && (
        <section aria-labelledby="destaques-semana" className="max-w-5xl mx-auto px-6 pt-10">
          <div className="mb-4">
            <h2 id="destaques-semana" className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              <Flame size={20} className="text-orange-500" /> Destaques da semana
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">Os artigos mais lidos dos últimos 7 dias.</p>
          </div>
          <WeeklyHighlights posts={highlights} categories={categories} />
        </section>
      )}

      {/* Destaque das seasons: só na primeira página, sem filtro */}
      {seasons.length > 0 && page === 1 && !hasActiveFilters && (
        <section aria-labelledby="seasons-destaque" className="max-w-5xl mx-auto px-6 pt-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 id="seasons-destaque" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Seasons
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Artigos em sequência para aprender um assunto do começo ao fim.
              </p>
            </div>
            {seasons.length > 3 && (
              <Link to="/seasons" className="shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Ver todas →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {seasons.slice(0, 3).map((season) => (
              <SeasonCard key={season.slug} season={season} headingLevel="h3" />
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      {/* scroll-mt: o título não fica escondido atrás do header fixo */}
      <main id="posts" className="max-w-5xl mx-auto px-6 py-10 scroll-mt-16">

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

        {/* Busca + formato */}
        {/* Celular: busca em cima, ordem e formato embaixo */}
        <div className="mb-6 flex flex-wrap sm:flex-nowrap items-start gap-3">
          <div className="w-full sm:w-auto sm:flex-1 min-w-0">
            <FilterBar
              onSearch={handleSearch}
              showDateRange={false}
              onClear={clearFilters}
              searchValue={search}
              hasActiveFilters={hasActiveFilters}
              searchPlaceholder="Buscar artigo..."
            />
          </div>
          <label htmlFor="ordem" className="sr-only">Ordenar artigos</label>
          <select
            id="ordem"
            name="ordem"
            value={sort.value}
            onChange={(e) => changeSort(e.target.value)}
            title="Ordenar artigos"
            className="flex-1 sm:flex-none min-w-0 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ViewToggle value={view} onChange={changeView} />
        </div>

        {loading && (
          <div className={LAYOUT[view]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} variant={view} />
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
          <div className={LAYOUT[view]}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant={view}
                categoryLabel={categories.find((c) => c.slug === post.category)?.label}
                seasonLabel={seasons.find((s) => s.slug === post.season)?.title}
              />
            ))}
          </div>
        )}

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={goToPage}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={changePageSize}
            total={total}
            className="mt-10"
          />
        )}

        <PostFaq items={BLOG_FAQ} className="mt-16 max-w-3xl" />

        <div className="mt-12">
          <SubscribeForm location="home" />
        </div>
      </main>
    </BlogLayout>
  );
}
