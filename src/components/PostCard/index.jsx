import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}>
      <article
        className="
          group
          rounded-xl
          border border-gray-200 dark:border-gray-800
          bg-white dark:bg-gray-900
          p-4 sm:p-5
          transition
          hover:shadow-lg
        "
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* Imagem */}
          <div className="w-full h-40 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 capitalize">
                {post.category}
              </span>
              <span>{post.publishedAt}</span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {post.title}
            </h2>

            {post.excerpt && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}