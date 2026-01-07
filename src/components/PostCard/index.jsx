import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block rounded-xl overflow-hidden border
                 border-gray-200 dark:border-gray-800
                 bg-white dark:bg-gray-900
                 hover:shadow-lg transition"
    >
      <article className="flex gap-6 p-5">
        {/* Imagem */}
        {post.coverImage && (
          <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover
                         group-hover:scale-105 transition"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex flex-col justify-between">
          <div>
            <div
              className="flex items-center gap-3 text-sm mb-1
                            text-gray-500 dark:text-gray-400"
            >
              <span
                className="px-2 py-0.5 rounded
                               bg-gray-100 dark:bg-gray-800
                               capitalize"
              >
                {post.category}
              </span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            <h2
              className="text-xl font-semibold
                           text-gray-900 dark:text-gray-100
                           group-hover:text-blue-600 dark:group-hover:text-blue-400
                           transition"
            >
              {post.title}
            </h2>

            {post.excerpt && (
              <p
                className="mt-2 line-clamp-2
                            text-gray-600 dark:text-gray-400"
              >
                {post.excerpt}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
