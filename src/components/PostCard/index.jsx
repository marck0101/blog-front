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

          {/* Overlay mobile: data, autor e título sobre a imagem */}
          <div className="md:hidden absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
            <p className="text-xs text-gray-200">
              {date} • {AUTHOR_NAME}
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-white">
              {post.title}
            </h2>
          </div>
        </div>

        {/* CONTEÚDO (desktop/tablet) */}
        <div className="hidden md:block pt-3">
          <p className="text-sm text-gray-500">
            {post.category} • {date}
          </p>

          <h2 className="mt-1 text-lg font-semibold text-gray-900 transition-colors duration-150 group-hover:text-blue-600">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          <div className="mt-4 text-sm font-medium text-blue-600">
            Ler artigo →
          </div>
        </div>
      </Link>
    </article>
  );
}
