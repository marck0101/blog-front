import { useEffect } from "react";
import BlogHeader from "../components/Blog/Header";
import BlogFooter from "../components/Blog/Footer";
import { loadFeatures } from "../utils/features";

// activeNav: item do menu em destaque (ver BlogHeader); sem ele, deduz pela URL.
// skin-*: ganchos do modo raiz (public/skins/raiz.css); o painel não tem.
export default function BlogLayout({ children, activeNav }) {
  // Recursos ligados/desligados no painel: uma busca por carregamento da página
  useEffect(() => {
    loadFeatures();
  }, []);

  return (
    <div className="skin-root min-h-screen flex flex-col">
      <BlogHeader activeNav={activeNav} />
      <div className="flex-1">{children}</div>
      <BlogFooter />
    </div>
  );
}
