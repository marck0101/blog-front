import { useEffect, useState } from "react";
import PostCard from "../PostCard";
import PostsService from "../../services/posts.service";
import { trackEvent } from "../../utils/analytics";

/**
 * "Continue lendo" no fim do post: 3 artigos da mesma categoria (mais lidos
 * primeiro), completando com outras categorias quando faltar.
 */
export default function RelatedPosts({ post, categories = [], seasons = [] }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let active = true;
    PostsService.getRelated(post._id)
      .then((list) => active && setPosts(list))
      .catch(() => active && setPosts([]));
    return () => {
      active = false;
    };
  }, [post._id]);

  if (posts.length === 0) return null;

  const label = (slug) => categories.find((c) => c.slug === slug)?.label;
  const allSameCategory = posts.every((p) => p.category === post.category);
  const categoryLabel = label(post.category);

  return (
    <section aria-labelledby="continue-lendo" className="mt-12">
      <h2 id="continue-lendo" className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Continue lendo
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">
        {allSameCategory && categoryLabel ? `Mais artigos sobre ${categoryLabel}.` : "Outros artigos que você pode gostar."}
      </p>
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        onClick={(e) => {
          const link = e.target.closest?.("a[href^='/blog/']");
          if (!link) return;
          trackEvent("related_click", {
            from_slug: post.slug,
            to_slug: link.getAttribute("href").replace("/blog/", ""),
            post_category: post.category,
          });
        }}
      >
        {posts.map((p) => (
          <PostCard
            key={p._id}
            post={{ ...p, id: p._id, publishedAt: p.publishedAt || p.createdAt }}
            categoryLabel={label(p.category)}
            seasonLabel={seasons.find((s) => s.slug === p.season)?.title}
          />
        ))}
      </div>
    </section>
  );
}
