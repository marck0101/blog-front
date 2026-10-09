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
  Users,
  CalendarDays,
  Mail,
  Menu,
  X,
} from "lucide-react";

// match: "exact" = só o caminho | "prefix" = caminho e subrotas | null = nunca ativo
const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { to: "/admin/posts", label: "Postagens", icon: FileText, match: "exact" },
  { to: "/admin/trash", label: "Lixeira", icon: Trash, match: "exact" },
  { to: "/admin/subscribers", label: "Assinantes", icon: Users, match: "exact" },
  { to: "/admin/campaigns", label: "Envios", icon: Mail, match: "prefix" },
  { to: "/admin/calendar", label: "Calendário", icon: CalendarDays, match: "exact" },
  { to: "/blog", label: "Ver blog", icon: ArrowsUpFromLine, match: null },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCreatePostRoute = location.pathname === "/admin/create-post";

  const [theme, setTheme] = useState("light");
  // Guarda a rota em que o menu mobile foi aberto: ao navegar ele fecha sozinho
  const [menuPath, setMenuPath] = useState(null);
  const menuOpen = menuPath === location.pathname;
  const setMenuOpen = (open) => setMenuPath(open ? location.pathname : null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  // Esc fecha o menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const isActive = ({ to, match }) =>
    match === "exact"
      ? location.pathname === to
      : match === "prefix"
        ? location.pathname.startsWith(to)
        : false;

  const navItemClass = (active) =>
    `relative group p-2 rounded transition ${
      active
        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const mobileItemClass = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      active
        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
    }`;

  const tooltipClass =
    "fixed pointer-events-none px-2 py-1 text-xs rounded bg-black text-white " +
    "opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-[9999] translate-y-2";

  const themeButton = (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="relative group p-2 rounded border
        text-gray-700 dark:text-gray-200
        bg-gray-100 dark:bg-gray-800
        border-gray-300 dark:border-gray-700
        hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      {theme === "dark" ? "🌙" : "☀️"}
      <span className={`${tooltipClass} hidden md:block`} style={{ top: 64 }}>Alternar tema</span>
    </button>
  );

  return (
    <>
      <header className="relative z-40 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex justify-between items-center gap-3">
          {/* LOGO */}
          <Link
            to={isAdminRoute ? "/admin" : "/blog"}
            className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate"
          >
            {isAdminRoute ? "marck0101 Admin" : "marck0101"}
          </Link>

          {/* NAV DESKTOP */}
          <nav className={`${isAdminRoute ? "hidden md:flex" : "flex"} gap-3 items-center shrink-0`}>
            {isAdminRoute && (
              <>
                {ADMIN_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} aria-label={link.label} className={navItemClass(isActive(link))}>
                    <link.icon size={18} />
                    <span className={tooltipClass} style={{ top: 64 }}>{link.label}</span>
                  </Link>
                ))}

                {user && (
                  <button
                    onClick={logout}
                    aria-label="Sair"
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
              <Link to="/admin" aria-label="Área admin" className={navItemClass(false)}>
                <LayoutDashboard size={18} />
                <span className={tooltipClass} style={{ top: 64 }}>Área admin</span>
              </Link>
            )}

            <div className="ml-2">{themeButton}</div>
          </nav>

          {/* NAV MOBILE: tema + hambúrguer */}
          {isAdminRoute && (
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {themeButton}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuOpen}
                aria-controls="admin-mobile-menu"
                className="p-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          )}
        </div>

        {/* PAINEL MOBILE */}
        {isAdminRoute && menuOpen && (
          <nav
            id="admin-mobile-menu"
            className="md:hidden absolute left-0 right-0 top-full border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg"
          >
            <div className="px-4 py-3 grid gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {ADMIN_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive(link) ? "page" : undefined}
                  className={mobileItemClass(isActive(link))}
                >
                  <link.icon size={18} className="shrink-0" />
                  {link.label}
                </Link>
              ))}

              {!isCreatePostRoute && (
                <Link to="/admin/create-post" className={`${mobileItemClass(false)} text-blue-600 dark:text-blue-400`}>
                  <Plus size={18} className="shrink-0" />
                  Novo post
                </Link>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="mt-1 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <LogOut size={18} className="shrink-0" />
                  Sair
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Fundo escurecido atrás do menu mobile; toque fora fecha */}
      {isAdminRoute && menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB — criar novo post */}
      {isAdminRoute && !isCreatePostRoute && (
        <button
          onClick={() => navigate("/admin/create-post")}
          aria-label="Criar novo post"
          className="fixed bottom-6 right-6 z-50 group
            flex items-center justify-center
            w-14 h-14 rounded-full
            bg-blue-600 hover:bg-blue-700
            text-white shadow-lg transition"
        >
          <Plus size={26} />
          <span className="fixed pointer-events-none right-20 bottom-8 px-3 py-1
            text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100
            transition whitespace-nowrap hidden md:block">
            Criar novo post
          </span>
        </button>
      )}
    </>
  );
}
