import { useEffect } from "react";
import BlogHeader from "../components/Blog/Header";
import BlogFooter from "../components/Blog/Footer";
import { loadFeatures } from "../utils/features";

// Id reservado em utils/headings.js (RESERVED_IDS)
const CONTENT_ID = "conteudo-principal";

// Teclado/leitor de tela pula o menu e as categorias. Foca sem trocar o #
// da URL: no post o # é da seção do sumário ou dos comentários.
function skipToContent(event) {
  const target = document.getElementById(CONTENT_ID);
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.scrollIntoView({ block: "start" });
}

// activeNav: item do menu em destaque (ver BlogHeader); sem ele, deduz pela URL.
// skin-*: ganchos do modo raiz (public/skins/raiz.css); o painel não tem.
export default function BlogLayout({ children, activeNav }) {
  // Recursos ligados/desligados no painel: uma busca por carregamento da página
  useEffect(() => {
    loadFeatures();
  }, []);

  return (
    <div className="skin-root min-h-screen flex flex-col">
      <a
        href={`#${CONTENT_ID}`}
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>
      <BlogHeader activeNav={activeNav} />
      <div id={CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </div>
      <BlogFooter />
    </div>
  );
}
