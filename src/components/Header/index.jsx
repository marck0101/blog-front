import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle(
      "dark",
      savedTheme === "dark"
    );
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to={isAdmin ? "/admin/posts" : "/blog"}
          className="font-bold text-lg text-gray-900 dark:text-gray-100"
        >
          {isAdmin ? "Admin Blog" : "Meu Blog"}
        </Link>

        <nav className="flex gap-6 text-sm items-center">
          {isAdmin ? (
            <>
              <Link className="text-gray-600 dark:text-gray-300" to="/admin/posts">
                Postagens
              </Link>
              <Link className="text-gray-600 dark:text-gray-300" to="/admin/create-post">
                Criar Post
              </Link>
              <Link className="text-gray-600 dark:text-gray-300" to="/admin/trash">
                Lixeira
              </Link>
              <Link className="text-gray-600 dark:text-gray-300" to="/blog">
                Blog
              </Link>
            </>
          ) : (
            <>
              <Link className="text-gray-600 dark:text-gray-300" to="/blog">
                Blog
              </Link>
              <Link className="text-gray-600 dark:text-gray-300" to="/admin/posts">
                Admin
              </Link>
            </>
          )}

          {/* Toggle Dark Mode */}
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
