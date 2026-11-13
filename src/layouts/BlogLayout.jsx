import BlogHeader from "../components/Blog/Header";
import BlogFooter from "../components/Blog/Footer";

// activeNav: item do menu em destaque (ver BlogHeader); sem ele, deduz pela URL.
// skin-*: ganchos do modo raiz (public/skins/raiz.css); o painel não tem.
export default function BlogLayout({ children, activeNav }) {
  return (
    <div className="skin-root min-h-screen flex flex-col">
      <BlogHeader activeNav={activeNav} />
      <div className="flex-1">{children}</div>
      <BlogFooter />
    </div>
  );
}
