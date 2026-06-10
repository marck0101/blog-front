import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";

const AUTHOR_NAME = "Marcos Henrique";

export default function PostCard({ post }) {
  const coverSrc = normalizeImageUrl(post.coverImage);
  const date = new Date(post.publishedAt).toLocaleDateString();

  return (
    <article className="group cursor-pointer">
      <Link to={`/blog/${post.slug || post.id}`} className="block">
        {/* IMAGEM */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <FileText className="text-gray-300" size={48} />
            </div>
          )}

          {/* Scrim sólido na área do texto, com efeito fosco */}
          <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/60 backdrop-blur-[2px] px-4 py-3">
            <p className="text-xs text-white/80 mb-0.5">
              {date} • {AUTHOR_NAME}
            </p>
            <h2 className="text-white font-semibold text-base md:text-lg leading-snug transition-colors duration-150 group-hover:text-blue-300">
              {post.title}
            </h2>
          </div>
        </div>

        {/* CONTEÚDO abaixo da imagem */}
        <div className="pt-3">
          {post.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          <div className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            Ler artigo →
          </div>
        </div>
      </Link>
    </article>
  );
}
