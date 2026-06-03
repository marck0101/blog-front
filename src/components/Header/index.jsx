import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  LogOut,
  FileText,
  Plus,
  Trash,
  ArrowsUpFromLine,
  LayoutDashboard,
} from "lucide-react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCreatePostRoute = location.pathname === "/admin/create-post";

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const isActive = (path) => location.pathname === path;

  const navItemClass = (active) =>
    `relative group p-2 rounded transition ${
      active
        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const tooltipClass =
    "fixed pointer-events-none px-2 py-1 text-xs rounded bg-black text-white " +
    "opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-[9999] translate-y-2";

  return (
    <>
      <header className="w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="w-full max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* LOGO */}
          <Link
            to={isAdminRoute ? "/admin" : "/blog"}
            className="font-bold text-lg text-gray-900 dark:text-gray-100 shrink-0"
          >
            {isAdminRoute ? "marck0101 Admin" : "marck0101"}
          </Link>

          {/* NAV */}
          <nav className="flex gap-3 items-center">
            {/* ADMIN NAV */}
            {isAdminRoute && (
              <>
                <Link to="/admin" className={navItemClass(isActive("/admin"))}>
                  <LayoutDashboard size={18} />
                  <span className={tooltipClass} style={{ top: 64 }}>Dashboard</span>
                </Link>

                <Link to="/admin/posts" className={navItemClass(isActive("/admin/posts"))}>
                  <FileText size={18} />
                  <span className={tooltipClass} style={{ top: 64 }}>Postagens</span>
                </Link>

                <Link to="/admin/trash" className={navItemClass(isActive("/admin/trash"))}>
                  <Trash size={18} />
                  <span className={tooltipClass} style={{ top: 64 }}>Lixeira</span>
                </Link>

                <Link to="/blog" className={navItemClass(false)}>
                  <ArrowsUpFromLine size={18} />
                  <span className={tooltipClass} style={{ top: 64 }}>Ver blog</span>
                </Link>

                {user && (
                  <button
                    onClick={logout}
                    className="relative group p-2 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  >
                    <LogOut size={18} />
                    <span className={tooltipClass} style={{ top: 64 }}>Sair</span>
                  </button>
                )}
              </>
            )}

            {/* BLOG NAV */}
            {!isAdminRoute && (
              <Link to="/admin" className={navItemClass(false)}>
                <LayoutDashboard size={18} />
                <span className={tooltipClass} style={{ top: 64 }}>Área admin</span>
              </Link>
            )}

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="relative group ml-2 p-2 rounded border
                text-gray-700 dark:text-gray-200
                bg-gray-100 dark:bg-gray-800
                border-gray-300 dark:border-gray-700
                hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {theme === "dark" ? "🌙" : "☀️"}
              <span className={tooltipClass} style={{ top: 64 }}>Alternar tema</span>
            </button>
          </nav>
        </div>
      </header>

      {/* FAB — criar novo post */}
      {isAdminRoute && !isCreatePostRoute && (
        <button
          onClick={() => navigate("/admin/create-post")}
          className="fixed bottom-6 right-6 z-50 group
            flex items-center justify-center
            w-14 h-14 rounded-full
            bg-blue-600 hover:bg-blue-700
            text-white shadow-lg transition"
        >
          <Plus size={26} />
          <span className="fixed pointer-events-none right-20 bottom-8 px-3 py-1
            text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100
            transition whitespace-nowrap">
            Criar novo post
          </span>
        </button>
      )}
    </>
  );
}
