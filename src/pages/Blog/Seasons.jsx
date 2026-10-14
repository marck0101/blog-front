import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import SubscribeForm from "../../components/SubscribeForm";
import SeasonsService from "../../services/seasons.service";
import SeasonCard from "../../components/SeasonCard";
import { setPageContext } from "../../utils/analytics";
import { AUTHOR_NAME } from "../../seo/site";

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
        title={`Seasons | ${AUTHOR_NAME}`}
        description="Séries de artigos que se complementam: comece pelo primeiro episódio e avance do básico ao avançado."
        url="/seasons"
      />

      <main className="max-w-5xl mx-auto px-6 py-10">
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
            {seasons.map((season) => (
              <SeasonCard key={season.slug} season={season} />
            ))}
          </div>
        )}

        <div className="mt-16 max-w-3xl">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
