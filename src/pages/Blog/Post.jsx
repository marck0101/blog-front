import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import BlogLayout from "../../layouts/BlogLayout";
import useSEO from "../../hooks/useSEO";
import Breadcrumb from "../../components/Breadcrumb";
import BackButton from "../../components/BackButton";
import PostsService from "../../services/posts.service";

export default function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: post ? `${post.title} | Meu Blog` : "Carregando post...",
    description: post?.excerpt,
    image: post?.coverImage || "/og-default.png",
  });

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    PostsService.getPublicById(id)
      .then((res) => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <BlogLayout>
        <main className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-gray-600 dark:text-gray-400">Carregando post...</p>
        </main>
      </BlogLayout>
    );
  }

  if (!post) {
    return (
      <BlogLayout>
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Post não encontrado
          </h2>
        </main>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <BackButton />
        <Breadcrumb title={post.title} />

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {post.title}
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {post.category} • {new Date(post.publishedAt).toLocaleDateString()}
        </p>

        <article className="prose prose-lg max-w-none mt-8 dark:prose-invert">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
      </main>
    </BlogLayout>
  );
}
