import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, FileText } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import SubscribeForm from "../../components/SubscribeForm";
import SeasonsService from "../../services/seasons.service";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { setPageContext } from "../../utils/analytics";

// /seasons — séries de posts que se complementam (só as que já têm episódio publicado)
export default function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageContext({ page_type: "seasons" });
    SeasonsService.getPublic()
      .then(setSeasons)
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <BlogLayout>
      <SEO
        title="Seasons"
        description="Séries de artigos que se complementam: comece pelo primeiro episódio e avance do básico ao avançado."
        url="/seasons"
      />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <nav className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">Seasons</span>
        </nav>

        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Layers size={16} /> Seasons
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Assuntos em sequência, do básico ao avançado
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Cada season reúne artigos que se complementam. Leia na ordem: cada episódio prepara o
            próximo, até você dominar o assunto de ponta a ponta.
          </p>
        </header>

        {loading && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && seasons.length === 0 && (
          <EmptyState
            title="Nenhuma season publicada ainda"
            description="Em breve: séries de artigos para estudar um assunto do começo ao fim."
          />
        )}

        {!loading && seasons.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasons.map((season) => {
              const cover = normalizeImageUrl(season.coverImage);
              return (
                <article key={season.slug} className="group h-full">
                  <Link
                    to={`/seasons/${season.slug}`}
                    className="h-full flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition hover:border-blue-400 hover:shadow-md"
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {cover ? (
                        <img src={cover} alt="" width={640} height={360} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="text-gray-300" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-1.5">
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {season.episodes} {season.episodes === 1 ? "episódio" : "episódios"}
                      </p>
                      <h2 className="font-semibold text-lg leading-snug text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {season.title}
                      </h2>
                      {season.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{season.description}</p>
                      )}
                      <span className="mt-auto pt-2 text-sm font-medium text-blue-600 dark:text-blue-400">Ver episódios →</span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-16 max-w-3xl">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
