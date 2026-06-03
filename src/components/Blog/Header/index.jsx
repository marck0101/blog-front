import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SubscriberService from "../../../services/subscriber.service";
import ThemeToggle from "../../ThemeToggle";

const MAX_CATEGORIES = 5;

export default function BlogHeader() {
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    SubscriberService.getCategories()
      .then((cats) => setCategories(cats.slice(0, MAX_CATEGORIES)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white dark:bg-gray-900 transition-shadow duration-200 ${
        scrolled
          ? "shadow-md"
          : "border-b border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/blog"
          className="font-bold text-lg text-gray-900 dark:text-gray-100 shrink-0"
        >
          marck0101
        </Link>

        {/* Desktop nav — categorias */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/blog?categoria=${cat.slug}`}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Direita: theme toggle + assinar + hamburger */}
        <div className="flex items-center gap-2 shrink-0">
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
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/blog?categoria=${cat.slug}`}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-700 dark:text-gray-300 py-2.5 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {cat.label}
            </Link>
          ))}
          <a
            href="#assinar"
            onClick={() => setMenuOpen(false)}
            className="mt-3 text-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Assinar newsletter
          </a>
        </div>
      )}
    </header>
  );
}
