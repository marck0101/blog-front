import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite, useFavorites } from "../../utils/favorites";

/**
 * Favoritar o post neste navegador (lista em /favoritos).
 * variant: "button" (com texto, na página do post) | "icon" (só o coração, nos cards)
 */
export default function FavoriteButton({ post, variant = "button", location = "post", className = "" }) {
  const favorites = useFavorites();
  const saved = isFavorite(favorites, post.slug);
  const label = saved ? "Remover dos favoritos" : "Salvar nos favoritos";

  const onClick = (e) => {
    // Nos cards o botão fica sobre o link do post
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(post, location);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm border border-gray-200 dark:border-gray-700 transition hover:scale-105 ${
          saved ? "text-red-500" : "text-gray-600 dark:text-gray-300 hover:text-red-500"
        } ${className}`}
      >
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      title={label}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition ${
        saved
          ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400"
      } ${className}`}
    >
      <Heart size={16} fill={saved ? "currentColor" : "none"} />
      {saved ? "Salvo nos favoritos" : "Favoritar"}
    </button>
  );
}
