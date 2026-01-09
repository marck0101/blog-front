import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  LogIn,
  LogOut,
  Shield,
  FileText,
  Plus,
  Trash,
  Eye,
  ShieldUser,
  ArrowsUpFromLine,
} from "lucide-react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const { user, logout } = useContext(AuthContext);

  /**
   * ================= THEME =================
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
        {/* ================= LOGO ================= */}
        <Link
          to={isAdminRoute ? "/admin/posts" : "/blog"}
          className="font-bold text-lg text-gray-900 dark:text-gray-100"
        >
          {isAdminRoute ? "Admin Blog" : "Meu Blog"}
        </Link>

        {/* ================= NAV ================= */}
        <nav className="flex gap-6 text-sm items-center">
          {/* ================= ADMIN NAV ================= */}
          {isAdminRoute && user ? (
            <>
              <Link to="/admin/posts" className="nav-item">
                <FileText size={16} />
                {/* Postagens */}
              </Link>

              <Link to="/admin/create-post" className="nav-item">
                <Plus size={16} />
                {/* Criar Post */}
              </Link>

              <Link to="/admin/trash" className="nav-item">
                <Trash size={16} />
                {/* Lixeira */}
              </Link>

              <Link to="/blog" className="nav-item">
                <ArrowsUpFromLine size={16} />
                {/* Ver Blog */}
              </Link>
            </>
          ) : (
            /* ================= BLOG NAV ================= */
            <>
              <Link to="/blog" className="nav-item">
                <ArrowsUpFromLine size={16} />
                {/* Blog */}
              </Link>

              {user ? (
                <Link to="/admin/posts" className="nav-item">
                  {/* <Shield size={16} /> */}
                  <ShieldUser size={20} />

                  {/* Admin */}
                </Link>
              ) : (
                <button
                  onClick={() => navigate("/admin/login")}
                  className="flex items-center gap-2 px-4 py-1 rounded border
                    text-gray-700 dark:text-gray-200
                    bg-gray-100 dark:bg-gray-800
                    border-gray-300 dark:border-gray-700
                    hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <LogIn size={16} />
                  Login
                </button>
              )}
            </>
          )}

          {/* ================= LOGOUT ================= */}
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:underline"
            >
              <LogOut size={16} />
              Sair
            </button>
          )}

          {/* ================= THEME ================= */}
          <button
            onClick={toggleTheme}
            className="ml-2 px-3 py-1 rounded border
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
