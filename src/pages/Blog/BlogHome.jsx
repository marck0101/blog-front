import BlogLayout from "../../layouts/BlogLayout";
import { useEffect, useState } from "react";
import PostCard from "../../components/PostCard";
import PostCardSkeleton from "../../components/PostCardSkeleton";
import Filters from "../../components/Filters";
import useSEO from "../../hooks/useSEO";
import PostsService from "../../services/posts.service";
import EmptyState from "../../components/EmptyState";

export default function BlogHome() {
  const [category, setCategory] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  /* ================= NORMALIZAÇÃO ================= */
  const normalizePost = (post) => ({
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    coverImage: post.coverImage || null,
    publishedAt: post.publishedAt || post.createdAt,
  });

  /* ================= TOAST ================= */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useSEO({
    title: "Blog | marck0101",
    description: "Artigos sobre marketing, tecnologia e desenvolvimento",
  });

  useEffect(() => {
    let mounted = true;

    PostsService.getPublished()
      .then((data) => {
        if (!mounted) return;
        const normalized = data.map(normalizePost);
        setPosts(normalized);
      })
      .catch(() => {
        if (mounted) {
          setPosts([]);
          showToast("Erro ao carregar posts", "error");
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPosts = category
    ? posts.filter((post) => post.category === category)
    : posts;

  return (
    <BlogLayout>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Blog</h1>

        <Filters category={category} onChange={setCategory} />

        {loading && (
          <div className="grid gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && filteredPosts.length === 0 && (
          <EmptyState
            title="Nenhum post publicado ainda"
            description="Estamos preparando conteúdos incríveis. Volte em breve."
          />
        )}

        {!loading && (
          <div className="grid gap-6 mt-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </BlogLayout>
  );
}

// import BlogLayout from "../../layouts/BlogLayout";
// import { useEffect, useState } from "react";
// import PostCard from "../../components/PostCard";
// import PostCardSkeleton from "../../components/PostCardSkeleton";
// import Filters from "../../components/Filters";
// import useSEO from "../../hooks/useSEO";
// import PostsService from "../../services/posts.service";
// import EmptyState from "../../components/EmptyState";

// export default function BlogHome() {
//   const [category, setCategory] = useState("");
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useSEO({
//     title: "Blog | marck0101",
//     description: "Artigos sobre marketing, tecnologia e desenvolvimento",
//   });

//   useEffect(() => {
//     PostsService.getPublished()
//       .then((res) => setPosts(res.data))
//       .catch(() => setPosts([]))
//       .finally(() => setLoading(false));
//   }, []);

//   const filteredPosts = category
//     ? posts?.filter((post) => post?.category === category)
//     : posts;

//   return (
//     <BlogLayout>
//       <main className="max-w-5xl mx-auto px-6 py-10">
//         <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
//           Blog
//         </h1>

//         <Filters category={category} onChange={setCategory} />

//         {/* Skeleton */}
//         {loading && (
//           <div className="grid gap-6 mt-6">
//             {Array.from({ length: 4 }).map((_, index) => (
//               <PostCardSkeleton key={index} />
//             ))}
//           </div>
//         )}

//         {/* Estado vazio */}
//         {!loading && filteredPosts.length === 0 && (
//           <EmptyState
//             title="Nenhum post publicado ainda"
//             description="Estamos preparando conteúdos incríveis sobre marketing, tecnologia e crescimento. Volte em breve."
//           />
//         )}

//         {/* Posts */}
//         {!loading && (
//           <div className="grid gap-6 mt-6">
//             {filteredPosts?.map((post) => (
//               <PostCard key={post._id} post={post} />
//             ))}
//           </div>
//         )}
//       </main>
//     </BlogLayout>
//   );
// }
