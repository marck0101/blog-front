import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <article className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
      <Link to={`/blog/${post.id}`} className="block">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-56 object-cover"
          />
        )}

        <div className="p-5">
          <h2 className="text-xl font-semibold">{post.title}</h2>

          <p className="text-sm text-gray-500 mt-1">
            {post.category} •{" "}
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>

          {post.excerpt && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              {post.excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
