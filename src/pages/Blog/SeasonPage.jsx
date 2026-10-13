import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layers, FileText } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import SubscribeForm from "../../components/SubscribeForm";
import SeasonsService from "../../services/seasons.service";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { setPageContext } from "../../utils/analytics";

// /seasons/:slug — episódios publicados da season, na ordem de leitura
export default function SeasonPage() {
  const { slug } = useParams();
  // Resultado guardado junto com o slug: trocou de season, volta a "carregando"
  const [result, setResult] = useState({ slug: null, data: null });
  const loading = result.slug !== slug;
  const data = loading ? null : result.data;

  useEffect(() => {
    let cancelled = false;
    SeasonsService.getPublicOne(slug)
      .then((res) => { if (!cancelled) setResult({ slug, data: res }); })
      .catch(() => { if (!cancelled) setResult({ slug, data: null }); });
    setPageContext({ page_type: "season", season_slug: slug });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <BlogLayout>
        <main className="max-w-3xl mx-auto px-6 py-10 min-h-screen">
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </main>
      </BlogLayout>
    );
  }

  if (!data) {
    return (
      <BlogLayout>
        <SEO title="Season não encontrada" robots="noindex" url={`/seasons/${slug}`} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Season não encontrada</h1>
          <Link to="/seasons" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline">
            Ver todas as seasons →
          </Link>
        </main>
      </BlogLayout>
    );
  }

  const { season, posts } = data;
  const first = posts[0];

  return (
    <BlogLayout>
      <SEO
        title={`${season.title} | Season`}
        description={season.description || `Season com ${posts.length} artigos sobre ${season.title}.`}
        image={first?.coverImage}
        url={`/seasons/${season.slug}`}
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <Link to="/seasons" className="hover:underline dark:hover:text-gray-100">Seasons</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">{season.title}</span>
        </nav>

        <header>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Layers size={16} /> Season · {posts.length} {posts.length === 1 ? "episódio" : "episódios"}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{season.title}</h1>
          {season.description && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{season.description}</p>
          )}
          {first && (
            <Link
              to={`/blog/${first.slug}`}
              className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Começar pelo episódio 1 →
            </Link>
          )}
        </header>

        <ol className="mt-10 space-y-4">
          {posts.map((post, i) => {
            const cover = normalizeImageUrl(post.coverImage);
            return (
              <li key={post._id}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group flex gap-4 items-start rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-4 transition hover:border-blue-400 hover:shadow-md"
                >
                  <span className="shrink-0 w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="hidden sm:block w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {cover ? (
                      <img src={cover} alt="" width={320} height={180} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="text-gray-300" size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
