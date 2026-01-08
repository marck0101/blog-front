import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="
        block
        rounded-xl
        bg-gray-900/60
        hover:bg-gray-900/80
        transition
        border border-gray-800
      "
    >
      <article
        className="
          flex flex-col sm:flex-row
          gap-4 sm:gap-6
          p-4 sm:p-6
        "
      >
        {/* Imagem */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="
              w-full
              h-48
              sm:w-40 sm:h-28
              object-cover
              rounded-lg
              flex-shrink-0
            "
            loading="lazy"
          />
        )}

        {/* Conteúdo */}
        <div className="flex flex-col gap-2">
          {/* Categoria e data */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 rounded bg-gray-800">
              {post.category}
            </span>
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>

          {/* Título */}
          <h2
            className="
              text-lg sm:text-xl
              font-semibold
              text-gray-100
              leading-snug
            "
          >
            {post.title}
          </h2>

          {/* Resumo (oculto no mobile para foco no título) */}
          {post.excerpt && (
            <p
              className="
                text-sm
                text-gray-400
                line-clamp-2
                hidden sm:block
              "
            >
              {post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
