import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  console.log('obj todo aqui',post)
  return (
    <article className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
      <Link
        to={`/blog/${post.id}`}
        className="block md:grid md:grid-cols-[260px_1fr] md:gap-0"
      >
        {/* IMAGEM */}
        {post.coverImage && (
          <div className="w-full h-56 md:h-full md:max-h-[220px] overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* CONTEÚDO */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold leading-snug">
              {post.title}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {post.category} •{" "}
              {new Date(post.publishedAt).toLocaleDateString()}
            </p>

            {post.excerpt && (
              <p className="mt-3 text-gray-600 dark:text-gray-400 line-clamp-3">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* CTA VISUAL (DESKTOP) */}
          <div className="hidden md:block mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
            Ler artigo →
          </div>
        </div>
      </Link>
    </article>
  );
}
