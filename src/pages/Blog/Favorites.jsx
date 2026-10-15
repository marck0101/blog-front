import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import EmptyState from "../../components/EmptyState";
import PostCard from "../../components/PostCard";
import SubscriberService from "../../services/subscriber.service";
import { useFavorites } from "../../utils/favorites";
import { setPageContext } from "../../utils/analytics";

// /favoritos — posts salvos neste navegador (localStorage, sem conta)
export default function Favorites() {
  const favorites = useFavorites();
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setPageContext({ page_type: "favorites" });
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <BlogLayout>
      <SEO title="Favoritos" robots="noindex" url="/favoritos" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <nav className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">Favoritos</span>
        </nav>

        <header className="max-w-3xl">
          <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            <Heart size={28} className="text-red-500" /> Seus favoritos
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Ficam salvos só neste navegador, sem cadastro. Se limpar os dados do navegador ou trocar de
            aparelho, a lista começa do zero.
          </p>
        </header>

        {favorites.length === 0 ? (
          <EmptyState
            title="Nenhum favorito ainda"
            description="Toque no coração de um artigo para guardar e ler depois."
            actionLabel="Ver artigos"
            onAction={() => navigate("/blog")}
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {favorites.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                categoryLabel={categories.find((c) => c.slug === post.category)?.label}
              />
            ))}
          </div>
        )}
      </main>
    </BlogLayout>
  );
}
