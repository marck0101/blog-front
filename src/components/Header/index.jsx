import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Header() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const { user, logout } = useContext(AuthContext);

  /**
   * ================= THEME =================
   * Q!W@E#R$
   */
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* ================= LOGO / TITLE ================= */}
        <Link
          to={isAdminRoute ? "/admin/posts" : "/blog"}
          className="font-bold text-lg text-gray-900 dark:text-gray-100"
        >
          {isAdminRoute ? "Admin Blog" : "Meu Blog"}
        </Link>

        {/* ================= NAV ================= */}
        <nav className="flex gap-6 text-sm items-center">
          {/* ===== ADMIN NAV ===== */}
          {isAdminRoute && user ? (
            <>
              <Link
                className="text-gray-600 dark:text-gray-300 hover:underline"
                to="/admin/posts"
              >
                Postagens
              </Link>

              <Link
                className="text-gray-600 dark:text-gray-300 hover:underline"
                to="/admin/create-post"
              >
                Criar Post
              </Link>

              <Link
                className="text-gray-600 dark:text-gray-300 hover:underline"
                to="/admin/trash"
              >
                Lixeira
              </Link>

              <Link
                className="text-gray-600 dark:text-gray-300 hover:underline"
                to="/blog"
              >
                Ver Blog
              </Link>
            </>
          ) : (
            /* ===== BLOG NAV ===== */
            <>
              <Link
                className="text-gray-600 dark:text-gray-300 hover:underline"
                to="/blog"
              >
                Blog
              </Link>

              {user && (
                <Link
                  className="text-gray-600 dark:text-gray-300 hover:underline"
                  to="/admin/posts"
                >
                  Admin
                </Link>
              )}
            </>
          )}

          {/* ===== AUTH ACTIONS ===== */}
          {user && (
            <button onClick={logout} className="text-red-500 hover:underline">
              Sair
            </button>
          )}

          {/* ===== THEME TOGGLE ===== */}
          <button
            onClick={toggleTheme}
            className="ml-4 px-3 py-1 rounded border
              text-gray-700 dark:text-gray-200
              bg-gray-100 dark:bg-gray-800
              border-gray-300 dark:border-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Alternar tema"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}
