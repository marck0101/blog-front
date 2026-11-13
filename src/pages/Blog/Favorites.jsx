import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookMarked, BookOpen, BookOpenCheck, Heart, Trash2 } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import PostCard from "../../components/PostCard";
import ConfirmDialog from "../../components/ConfirmDialog";
import SubscriberService from "../../services/subscriber.service";
import PostsService from "../../services/posts.service";
import { useFavorites } from "../../utils/favorites";
import { useFeatures } from "../../utils/features";
import { clearHistory, splitHistory, useReadingHistory } from "../../utils/readingHistory";
import { setPageContext, trackEvent } from "../../utils/analytics";

function Shelf({ id, icon: Icon, iconClass, title, hint, posts, categories }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        <Icon size={22} className={iconClass} aria-hidden="true" /> {title}
        <span className="text-base font-normal text-gray-500 dark:text-gray-400">({posts.length})</span>
      </h2>
      {hint && <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{hint}</p>}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} categoryLabel={categories.find((c) => c.slug === post.category)?.label} />
        ))}
      </div>
    </section>
  );
}

// Quantos dos posts publicados o leitor já leu, com barra
function Summary({ read, total }) {
  if (!total) return null;
  const done = Math.min(read, total);
  const pct = Math.round((done / total) * 100);
  return (
    <div className="skin-summary mt-8 max-w-xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <p className="text-gray-900 dark:text-gray-100">
        Você leu <strong className="tabular-nums">{done}</strong> de <strong className="tabular-nums">{total}</strong> posts do blog{" "}
        <span className="text-gray-500 dark:text-gray-400 tabular-nums">({pct}%)</span>
      </p>
      <div
        role="progressbar"
        aria-label="Posts do blog que você já leu"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="skin-readbar mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden"
      >
        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// /favoritos — Minhas leituras: favoritos, o que está lendo e o que já leu.
// Tudo salvo só neste navegador (localStorage, sem conta).
export default function Favorites() {
  const favorites = useFavorites();
  const history = useReadingHistory();
  const { readingHistory: historyOn } = useFeatures();
  const { reading, read } = historyOn ? splitHistory(history) : { reading: [], read: [] };
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setPageContext({ page_type: "favorites" });
    SubscriberService.getCategories().then(setCategories).catch(() => {});
    // Só o total de publicados (1 item): base do "você leu X de Y"
    PostsService.getPublished(1, 1)
      .then((d) => setTotal(Number(d?.total) || 0))
      .catch(() => {});
  }, []);

  const empty = favorites.length === 0 && reading.length === 0 && read.length === 0;
  const hasHistory = reading.length > 0 || read.length > 0;

  return (
    <BlogLayout>
      <SEO title="Minhas leituras" robots="noindex" url="/favoritos" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">Minhas leituras</span>
        </nav>

        <header className="max-w-3xl">
          <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            <BookMarked size={28} className="text-blue-600 dark:text-blue-400" aria-hidden="true" /> Minhas leituras
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Favoritos e o que você já leu ficam salvos só neste navegador, sem cadastro. Se limpar os dados do
            navegador ou trocar de aparelho, tudo começa do zero.
          </p>
        </header>

        {historyOn && <Summary read={read.length} total={total} />}

        {empty ? (
          <EmptyState
            title="Nada por aqui ainda"
            description="Os posts que você começar a ler e os que guardar no coração aparecem aqui."
            actionLabel="Ver artigos"
            onAction={() => navigate("/blog")}
          />
        ) : (
          <>
            <Shelf
              id="lendo"
              icon={BookOpen}
              iconClass="text-blue-600 dark:text-blue-400"
              title="Lendo agora"
              hint="Abra o post e use “Continuar de onde parou”."
              posts={reading}
              categories={categories}
            />
            <Shelf id="favoritos" icon={Heart} iconClass="text-red-500" title="Favoritos" posts={favorites} categories={categories} />
            <Shelf
              id="lidos"
              icon={BookOpenCheck}
              iconClass="text-green-600 dark:text-green-400"
              title="Já lidos"
              posts={read}
              categories={categories}
            />
          </>
        )}

        {hasHistory && (
          <div className="mt-14 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={16} aria-hidden="true" /> Apagar meu histórico de leitura
            </button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmClear}
        type="danger"
        title="Apagar o histórico de leitura?"
        description="Some o que você leu e onde parou em cada post, só neste navegador. Os favoritos ficam."
        confirmText="Apagar"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearHistory();
          trackEvent("reading_history_clear");
          setConfirmClear(false);
        }}
      />
    </BlogLayout>
  );
}
