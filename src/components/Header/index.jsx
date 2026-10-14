import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../../context/AuthContext";
import { resolveTheme, setThemePref, watchSystemTheme } from "../../utils/theme";
import {
  LogOut,
  FileText,
  Plus,
  Trash,
  ExternalLink,
  LayoutDashboard,
  Users,
  CalendarDays,
  Mail,
  BarChart3,
  Layers,
  Menu,
  ShieldCheck,
  Moon,
  Sun,
  X,
} from "lucide-react";

// match: "exact" = só o caminho | "prefix" = caminho e subrotas
const ADMIN_GROUPS = [
  {
    label: "Conteúdo",
    links: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
      { to: "/admin/posts", label: "Posts", icon: FileText, match: "prefix" },
      { to: "/admin/calendar", label: "Calendário", icon: CalendarDays, match: "exact" },
      { to: "/admin/seasons", label: "Seasons", icon: Layers, match: "exact" },
      { to: "/admin/trash", label: "Lixeira", icon: Trash, match: "exact" },
    ],
  },
  {
    label: "Audiência",
    links: [
      { to: "/admin/subscribers", label: "Assinantes", icon: Users, match: "exact" },
      { to: "/admin/campaigns", label: "Envios", icon: Mail, match: "prefix" },
      { to: "/admin/metrics", label: "Métricas", icon: BarChart3, match: "exact" },
    ],
  },
  {
    label: "Conta",
    links: [{ to: "/admin/security", label: "Segurança", icon: ShieldCheck, match: "exact" }],
  },
];
const ADMIN_LINKS = ADMIN_GROUPS.flatMap((g) => g.links);

// Título da aba por tela ("Posts · Admin"): ajuda com várias abas abertas
const PAGE_TITLES = [
  ["/admin/create-post", "Novo post"],
  ["/admin/posts/:id", "Editar post"],
  ["/admin/campaigns/new", "Novo envio"],
  ["/admin/campaigns/:id", "Envio"],
];
function pageTitle(pathname) {
  const special = PAGE_TITLES.find(([pattern]) => matchPath(pattern, pathname));
  if (special) return special[1];
  return ADMIN_LINKS.find((l) => l.to === pathname)?.label || "Admin";
}

// Onde o botão flutuante "+ novo post" faz sentido (nas outras telas há o "+ Novo …" de cada uma)
const FAB_ROUTES = ["/admin", "/admin/posts"];

/**
 * Navegação do admin: sidebar com texto a partir de 1024px; abaixo disso,
 * barra no topo com menu. A sidebar empurra o conteúdo via classe no <html>
 * (ver global.css), então as páginas não precisam saber dela.
 */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [theme, setTheme] = useState(() => resolveTheme());
  // Guarda a rota em que o menu mobile foi aberto: ao navegar ele fecha sozinho
  const [menuPath, setMenuPath] = useState(null);
  const menuOpen = menuPath === location.pathname;
  const setMenuOpen = (open) => setMenuPath(open ? location.pathname : null);

  useEffect(() => watchSystemTheme(setTheme), []);

  useEffect(() => {
    document.documentElement.classList.add("admin-layout");
    return () => document.documentElement.classList.remove("admin-layout");
  }, []);

  // Esc fecha o menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuPath(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const toggleTheme = () => setTheme(setThemePref(theme === "dark" ? "light" : "dark"));
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const isActive = ({ to, match }) =>
    match === "exact" ? location.pathname === to : location.pathname.startsWith(to);

  const itemClass = (active) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
      active
        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
    }`;

  const navLinks = (
    <>
      {ADMIN_GROUPS.map((group) => (
        <div key={group.label} className="space-y-0.5">
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {group.label}
          </p>
          {group.links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link) ? "page" : undefined}
              className={itemClass(isActive(link))}
            >
              <link.icon size={18} className="shrink-0" />
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </>
  );

  const footerActions = (
    <div className="space-y-0.5 pt-3 border-t">
      <Link to="/admin/create-post" className={`${itemClass(false)} text-blue-600 dark:text-blue-400`}>
        <Plus size={18} className="shrink-0" /> Novo post
      </Link>
      <a href="/blog" target="_blank" rel="noopener noreferrer" className={itemClass(false)}>
        <ExternalLink size={18} className="shrink-0" /> Ver blog
      </a>
      <button type="button" onClick={toggleTheme} className={`${itemClass(false)} w-full`}>
        <ThemeIcon size={18} className="shrink-0" /> {themeLabel}
      </button>
      {user && (
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <LogOut size={18} className="shrink-0" /> Sair
        </button>
      )}
    </div>
  );

  const showFab = FAB_ROUTES.includes(location.pathname);

  return (
    <>
      <Helmet>
        <title>{`${pageTitle(location.pathname)} · Admin`}</title>
      </Helmet>

      {/* SIDEBAR (≥1024px) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r bg-white dark:bg-gray-900">
        <Link to="/admin" className="px-6 py-5 font-bold text-lg text-gray-900 dark:text-gray-100">
          marck0101 <span className="font-normal text-gray-400">Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col justify-between gap-4">
          <div>{navLinks}</div>
          {footerActions}
        </nav>
      </aside>

      {/* TOPO (<1024px) */}
      <header className="lg:hidden relative z-40 w-full border-b bg-white dark:bg-gray-900">
        <div className="w-full px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
          <Link to="/admin" className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
            marck0101 <span className="font-normal text-gray-400">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            className="p-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="admin-mobile-menu"
            aria-label="Admin"
            className="absolute left-0 right-0 top-full border-b bg-white dark:bg-gray-900 shadow-lg"
          >
            <div className="px-4 py-2 max-h-[calc(100vh-4rem)] overflow-y-auto space-y-3">
              <div>{navLinks}</div>
              {footerActions}
            </div>
          </nav>
        )}
      </header>

      {/* Fundo escurecido atrás do menu mobile; toque fora fecha */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* FAB — criar novo post (só no Dashboard e em Posts) */}
      {showFab && (
        <button
          onClick={() => navigate("/admin/create-post")}
          aria-label="Criar novo post"
          title="Criar novo post"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition"
        >
          <Plus size={26} />
        </button>
      )}
    </>
  );
}
