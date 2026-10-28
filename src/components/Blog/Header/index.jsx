import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Menu, X, ChevronDown, Heart } from "lucide-react";
import { useFavorites } from "../../../utils/favorites";
import SubscriberService from "../../../services/subscriber.service";
import SeasonsService from "../../../services/seasons.service";
import ThemeToggle from "../../ThemeToggle";
import { prerendered } from "../../../utils/prerendered";

const VISIBLE_CATEGORIES_COUNT = 3;

// activeNav: item ativo definido pela página ("" = Todos, "seasons" ou slug da
// categoria). Sem ele, deduz pela URL.
export default function BlogHeader({ activeNav }) {
  // Valores do prerender: o menu já nasce completo, sem itens surgindo depois
  const [categories, setCategories] = useState(() => prerendered("categories") || []);
  // Link "Seasons" só aparece quando existe season com episódio publicado
  const [hasSeasons, setHasSeasons] = useState(() => (prerendered("seasons") || []).length > 0);
  const { pathname } = useLocation();
  const onSeasons = pathname.startsWith("/seasons");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  // Link "Favoritos" só aparece quando há post salvo neste navegador
  const favoritesCount = useFavorites().length;

  const visibleCategories = categories.slice(0, VISIBLE_CATEGORIES_COUNT);
  const moreCategories = categories.slice(VISIBLE_CATEGORIES_COUNT);

  const [searchParams] = useSearchParams();
  // Suporta múltiplas categorias: /blog?categoria=a&categoria=b
  const activeCategories = searchParams.getAll("categoria");
  // Item ativo: o da página (post → categoria, episódio → Seasons) ou, pela URL,
  // Seasons, "Todos" sem filtro, ou a categoria quando só uma está ativa
  const current =
    activeNav !== undefined
      ? activeNav
      : onSeasons
      ? "seasons"
      : activeCategories.length === 0
      ? ""
      : activeCategories.length === 1
      ? activeCategories[0]
      : null;
  // "Mais ▾" recebe estilo ativo quando a categoria ativa está dentro do dropdown
  const isMoreActive = moreCategories.some((cat) => cat.slug === current);

  useEffect(() => {
    SubscriberService.getCategories()
      .then(setCategories)
      .catch(() => {});
    SeasonsService.getPublic()
      .then((list) => setHasSeasons(list.length > 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha drawer com Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Fecha dropdown "Mais" ao clicar fora
  useEffect(() => {
    const onClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const navLinkClass = (slug) => {
    const isActive = slug === current;
    return `px-3 py-1.5 text-sm rounded-md transition whitespace-nowrap ${
      isActive
        ? "font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-shadow duration-200 ${
        scrolled
          ? "shadow-md"
          : "border-b border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/blog"
          className="font-bold text-lg text-gray-900 dark:text-gray-100 shrink-0"
        >
          marck0101
        </Link>

        {/* Desktop nav — todas as categorias com scroll horizontal */}
        <nav className="hidden md:flex items-center flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            <Link
              to="/blog"
              className={navLinkClass("")}
            >
              Todos
            </Link>

            {hasSeasons && (
              <Link to="/seasons" className={navLinkClass("seasons")}>
                Seasons
              </Link>
            )}

            {visibleCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/blog?categoria=${cat.slug}`}
                className={navLinkClass(cat.slug)}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Dropdown "Mais" — fora do <nav> com overflow-x-auto para o menu não ser cortado */}
        {moreCategories.length > 0 && (
          <div className="hidden md:block relative shrink-0" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`px-3 py-1.5 text-sm rounded-md transition whitespace-nowrap inline-flex items-center gap-1 ${
                isMoreActive
                  ? "font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              aria-haspopup="true"
              aria-expanded={moreOpen}
            >
              Mais
              <ChevronDown size={14} />
            </button>

            <div
              className={`absolute left-0 top-full mt-1 min-w-40 rounded-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1 transition-all duration-150 ${
                moreOpen
                  ? "opacity-100 translate-y-0 visible"
                  : "opacity-0 -translate-y-1 invisible pointer-events-none"
              }`}
            >
              {moreCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/blog?categoria=${cat.slug}`}
                  onClick={() => setMoreOpen(false)}
                  className={`block px-3 py-1.5 text-sm transition whitespace-nowrap ${
                    cat.slug === current
                      ? "font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Direita: theme toggle + assinar + hamburger (acesso do autor fica no rodapé) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {favoritesCount > 0 && (
            <Link
              to="/favoritos"
              aria-label={`Favoritos (${favoritesCount})`}
              title="Favoritos"
              className={`relative p-2 rounded-md transition ${
                pathname === "/favoritos"
                  ? "text-red-500"
                  : "text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Heart size={18} />
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">
                {favoritesCount}
              </span>
            </Link>
          )}

          <ThemeToggle />

          <a
            href="#assinar"
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Assinar
          </a>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex flex-col gap-1">
          {/* Todos */}
          <Link
            to="/blog"
            onClick={() => setMenuOpen(false)}
            className={`text-sm py-2.5 px-2 rounded-md transition ${
              current === ""
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Todos
          </Link>

          {hasSeasons && (
            <Link
              to="/seasons"
              onClick={() => setMenuOpen(false)}
              className={`text-sm py-2.5 px-2 rounded-md transition ${
                current === "seasons"
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Seasons
            </Link>
          )}

          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/blog?categoria=${cat.slug}`}
              onClick={() => setMenuOpen(false)}
              className={`text-sm py-2.5 px-2 rounded-md transition ${
                cat.slug === current
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {cat.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex flex-col gap-1">
            <a
              href="#assinar"
              onClick={() => setMenuOpen(false)}
              className="text-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Assinar newsletter
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
