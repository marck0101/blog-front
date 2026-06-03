import BlogHeader from "../components/Blog/Header";
import BlogFooter from "../components/Blog/Footer";

export default function BlogLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <BlogHeader />
      <div className="flex-1">{children}</div>
      <BlogFooter />
    </div>
  );
}
