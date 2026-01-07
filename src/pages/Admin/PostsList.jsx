import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostsService from "../../services/posts.service";
import PublishToggle from "../../components/PublishToggle";
import Header from "../../components/Header";
import PostSkeleton from "../../components/PostSkeleton";


export default function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    PostsService.listAdmin()
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (post) => {
    setLoadingId(post._id);
    const newStatus = !post.published;

    await PostsService.togglePublish(post._id, newStatus);

    setPosts((prev) =>
      prev.map((p) => (p._id === post._id ? { ...p, published: newStatus } : p))
    );

    setLoadingId(null);
  };

  const handleDelete = async (post) => {
    if (!confirm("Mover post para a lixeira?")) return;
    await PostsService.softDelete(post._id);
    setPosts((prev) => prev.filter((p) => p._id !== post._id));
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Posts
          </h1>

          {Array.from({ length: 5 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">Posts</h1>

        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="
                group
                flex gap-4 items-center p-4 rounded-lg border
                bg-white text-gray-900
                dark:bg-gray-900 dark:text-gray-100
                border-gray-200 dark:border-gray-800

                transition-all duration-200 ease-out
                hover:shadow-lg
                hover:-translate-y-0.5
              "
            >
              {/* Imagem */}
              <div
                className="
                  w-32 h-20 rounded overflow-hidden
                  bg-gray-100 dark:bg-gray-800
                  flex-shrink-0
                "
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="
                      w-full h-full object-cover
                      transition-transform duration-300
                      group-hover:scale-105
                    "
                  />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1">
                <h2
                  className="
                    text-lg font-semibold leading-tight
                    text-current
                    transition-colors duration-200
                    group-hover:text-blue-600
                    dark:group-hover:text-blue-400
                  "
                >
                  {post.title}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">
                  {post.category} •{" "}
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Status */}
              <PublishToggle
                checked={post.published}
                disabled={loadingId === post._id}
                onChange={() => handleToggle(post)}
              />

              {/* Ações */}
              <div className="flex gap-3 text-lg">
                <Link
                  to={`/admin/posts/${post._id}`}
                  title="Editar post"
                  className="
                    text-blue-600 dark:text-blue-400
                    hover:text-blue-800 dark:hover:text-blue-300
                    transition-colors
                  "
                >
                  ✏️
                </Link>

                <button
                  title="Mover para lixeira"
                  onClick={() => handleDelete(post)}
                  className="
                    text-red-600 dark:text-red-400
                    hover:text-red-800 dark:hover:text-red-300
                    transition-colors
                  "
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
