import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Menu, X, Lock, ChevronDown } from "lucide-react";
import SubscriberService from "../../../services/subscriber.service";
import ThemeToggle from "../../ThemeToggle";

const VISIBLE_CATEGORIES_COUNT = 3;

export default function BlogHeader() {
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const visibleCategories = categories.slice(0, VISIBLE_CATEGORIES_COUNT);
  const moreCategories = categories.slice(VISIBLE_CATEGORIES_COUNT);

  const [searchParams] = useSearchParams();
  // Suporta múltiplas categorias: /blog?categoria=a&categoria=b
  const activeCategories = searchParams.getAll("categoria");
  // Destaque no header apenas quando exatamente 1 categoria está ativa
  const singleActive = activeCategories.length === 1 ? activeCategories[0] : "";
  // "Mais ▾" recebe estilo ativo quando a categoria ativa está dentro do dropdown
  const isMoreActive = moreCategories.some((cat) => cat.slug === singleActive);

  useEffect(() => {
    SubscriberService.getCategories()
      .then(setCategories)
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
    const isActive = slug === ""
      ? activeCategories.length === 0          // "Todos" ativo quando sem filtro
      : slug === singleActive;                  // categoria ativa só se for a única
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

            {visibleCategories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/blog?categoria=${cat.slug}`}
                className={navLinkClass(cat.slug)}
              >
                {cat.label}
              </Link>
            ))}

            {moreCategories.length > 0 && (
              <div className="relative" ref={moreRef}>
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
                        cat.slug === singleActive
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
          </div>
        </nav>

        {/* Direita: theme toggle + assinar + cadeado + hamburger */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <ThemeToggle />

          <a
            href="#assinar"
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Assinar
          </a>

          {/* Cadeado — acesso admin */}
          <Link
            to="/admin/login"
            title="Área restrita"
            className="hidden md:flex p-2 rounded-md text-gray-300 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Lock size={14} />
          </Link>

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
              activeCategories.length === 0
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Todos
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/blog?categoria=${cat.slug}`}
              onClick={() => setMenuOpen(false)}
              className={`text-sm py-2.5 px-2 rounded-md transition ${
                cat.slug === singleActive
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
            <Link
              to="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="text-center text-sm text-gray-400 dark:text-gray-300 py-2 hover:text-gray-800 dark:hover:text-gray-100 transition"
            >
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
