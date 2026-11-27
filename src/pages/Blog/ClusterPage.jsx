import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, Compass } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import SubscribeForm from "../../components/SubscribeForm";
import ClustersService from "../../services/clusters.service";
import { normalizeImageUrl } from "../../utils/imageUrl";
import GeneratedCover from "../../components/GeneratedCover";
import { setPageContext, trackEvent } from "../../utils/analytics";
import { clusterTitle } from "../../seo/site";
import { ClusterSchema } from "../../components/StructuredData";
import { Loading, Skeleton } from "../../components/Skeleton";
import { ClusterServices } from "../../components/ClusterServices/ClusterServices";

function Cover({ post, className }) {
  const cover = normalizeImageUrl(post.coverImage);
  return (
    <div className={`shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}>
      {cover ? (
        <img src={cover} alt={post.coverImageAlt || ""} width={320} height={180} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      ) : (
        <GeneratedCover post={post} title={post.title} category={post.category} size="sm" />
      )}
    </div>
  );
}

// /temas/:slug — o artigo principal do tema (pilar) e os relacionados (R-CLU-03)
export default function ClusterPage() {
  const { slug } = useParams();
  // Resultado guardado junto com o slug: trocou de tema, volta a "carregando"
  const [result, setResult] = useState({ slug: null, data: null });
  const loading = result.slug !== slug;
  const data = loading ? null : result.data;

  useEffect(() => {
    let cancelled = false;
    ClustersService.getPublicOne(slug)
      .then((res) => { if (!cancelled) setResult({ slug, data: res }); })
      .catch(() => { if (!cancelled) setResult({ slug, data: null }); });
    setPageContext({ page_type: "cluster", cluster_slug: slug });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <BlogLayout>
        <main className="max-w-3xl mx-auto px-6 py-10 min-h-screen">
          <Loading label="Carregando tema">
            <Skeleton className="h-4 w-40 mb-6" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-3/4 mt-3" />
            <Skeleton className="h-5 w-full mt-3" />
            <Skeleton className="h-40 w-full mt-8" rounded="rounded-xl" />
            <div className="mt-8 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" rounded="rounded-xl" />)}
            </div>
          </Loading>
        </main>
      </BlogLayout>
    );
  }

  if (!data) {
    return (
      <BlogLayout>
        <SEO title="Tema não encontrado" robots="noindex" url={`/temas/${slug}`} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Tema não encontrado</h1>
          <Link to="/blog" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline">
            Ver todos os artigos →
          </Link>
        </main>
      </BlogLayout>
    );
  }

  const { cluster, pillar, posts } = data;
  const total = posts.length + (pillar ? 1 : 0);
  const openPost = (post, position) => () =>
    trackEvent("cluster_click", { cluster_slug: cluster.slug, post_slug: post.slug, position });

  return (
    <BlogLayout>
      <SEO
        title={clusterTitle(cluster)}
        description={cluster.description}
        image={(pillar || posts[0])?.coverImage}
        url={`/temas/${cluster.slug}`}
      />
      <ClusterSchema cluster={cluster} pillar={pillar} posts={posts} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <nav aria-label="Você está aqui" className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">{cluster.title}</span>
        </nav>

        <header>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Compass size={16} aria-hidden="true" /> Tema · {total} {total === 1 ? "artigo" : "artigos"}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{cluster.title}</h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{cluster.description}</p>
        </header>

        {pillar && (
          <section aria-labelledby="pilar" className="mt-10">
            <h2 id="pilar" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <BookOpen size={16} aria-hidden="true" /> Comece por aqui
            </h2>
            <Link
              to={`/blog/${pillar.slug}`}
              onClick={openPost(pillar, 0)}
              className="group mt-3 flex flex-col sm:flex-row gap-4 rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 transition hover:border-blue-400 hover:shadow-md"
            >
              <Cover post={pillar} className="w-full sm:w-56" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {pillar.title}
                </h3>
                {(pillar.directAnswer || pillar.excerpt) && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{pillar.directAnswer || pillar.excerpt}</p>
                )}
                {pillar.readingMinutes > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{pillar.readingMinutes} min de leitura</p>
                )}
              </div>
            </Link>
          </section>
        )}

        {!pillar && cluster.season && (
          <section aria-labelledby="serie" className="mt-10">
            <h2 id="serie" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <BookOpen size={16} aria-hidden="true" /> Comece pela série
            </h2>
            <Link
              to={`/seasons/${cluster.season}`}
              onClick={() => trackEvent("cluster_click", { cluster_slug: cluster.slug, season_slug: cluster.season, position: 0 })}
              className="mt-3 block rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 font-semibold text-gray-900 dark:text-gray-100 transition hover:border-blue-400 hover:shadow-md"
            >
              Ver a série completa deste tema →
            </Link>
          </section>
        )}

        {posts.length > 0 && (
          <section aria-labelledby="relacionados" className="mt-10">
            <h2 id="relacionados" className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {pillar ? "Para aprofundar" : "Artigos do tema"}
            </h2>
            <ul className="mt-3 space-y-4">
              {posts.map((post, i) => (
                <li key={post._id}>
                  <Link
                    to={`/blog/${post.slug}`}
                    onClick={openPost(post, i + 1)}
                    className="group flex gap-4 items-start rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-4 transition hover:border-blue-400 hover:shadow-md"
                  >
                    <Cover post={post} className="hidden sm:block w-40" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
                      )}
                      {post.readingMinutes > 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{post.readingMinutes} min de leitura</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ClusterServices clusterSlug={cluster.slug} />

        <div className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
