import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Layers } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import SubscribeForm from "../../components/SubscribeForm";
import SeasonsService from "../../services/seasons.service";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { formatMinutes } from "../../utils/readingTime";
import { seasonStatus, useSeasonProgress } from "../../utils/seasonProgress";
import GeneratedCover from "../../components/GeneratedCover";
import { SeasonProgressBar } from "../../components/SeasonCard";
import { setPageContext } from "../../utils/analytics";
import { AUTHOR_NAME } from "../../seo/site";

// /seasons/:slug — episódios publicados da season, na ordem de leitura
export default function SeasonPage() {
  const { slug } = useParams();
  // Resultado guardado junto com o slug: trocou de season, volta a "carregando"
  const [result, setResult] = useState({ slug: null, data: null });
  const loading = result.slug !== slug;
  const data = loading ? null : result.data;
  const progress = useSeasonProgress();

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
  const totalMinutes = posts.reduce((sum, p) => sum + (p.readingMinutes || 0), 0);
  const status = seasonStatus(progress, season.slug, posts.map((p) => p.slug));
  const nextIndex = posts.findIndex((p) => p.slug === status.next);

  // Chamada principal: começar, continuar de onde parou, ou rever
  const cta = !status.started
    ? first && { to: `/blog/${first.slug}`, label: "Começar pelo episódio 1 →" }
    : status.done
    ? first && { to: `/blog/${first.slug}`, label: "Season concluída · rever o episódio 1" }
    : { to: `/blog/${status.next}`, label: `Continuar de onde parei: episódio ${nextIndex + 1} →` };

  return (
    <BlogLayout>
      <SEO
        title={`${season.title} | Season | ${AUTHOR_NAME}`}
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
            {totalMinutes > 0 && <> · ~{formatMinutes(totalMinutes)} de leitura</>}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{season.title}</h1>
          {season.description && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{season.description}</p>
          )}
          <SeasonProgressBar readCount={status.readCount} total={status.total} className="mt-5 max-w-sm" />
          {cta && (
            <Link
              to={cta.to}
              className={`inline-block mt-6 px-5 py-2.5 rounded-lg font-medium transition ${
                status.done
                  ? "border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {cta.label}
            </Link>
          )}
        </header>

        <ol className="mt-10 space-y-4">
          {posts.map((post, i) => {
            const cover = normalizeImageUrl(post.coverImage);
            const read = status.read.has(post.slug);
            return (
              <li key={post._id}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group flex gap-4 items-start rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:p-4 transition hover:border-blue-400 hover:shadow-md"
                >
                  {read ? (
                    <span
                      title="Lido"
                      className="shrink-0 w-9 h-9 rounded-full bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 flex items-center justify-center"
                    >
                      <CheckCircle2 size={20} aria-label={`Episódio ${i + 1}, lido`} />
                    </span>
                  ) : (
                    <span className="shrink-0 w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold tabular-nums">
                      {i + 1}
                    </span>
                  )}
                  <div className="hidden sm:block w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {cover ? (
                      <img src={cover} alt="" width={320} height={180} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <GeneratedCover category={post.category} size="sm" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
                    )}
                    {post.readingMinutes > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{post.readingMinutes} min de leitura</p>
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
