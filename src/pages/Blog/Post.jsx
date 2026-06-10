import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import { BlogPostSchema } from "../../components/StructuredData";
import Breadcrumb from "../../components/Breadcrumb";
import BackButton from "../../components/BackButton";
import Lightbox from "../../components/Lightbox";
import PostsService from "../../services/posts.service";
import SubscribeForm from "../../components/SubscribeForm";

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });
  const contentRef = useRef(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);

    PostsService.getBySlug(slug)
      .then((postData) => {
        if (postData) return postData;
        return PostsService.getPublicById(slug);
      })
      .then((postData) => setPost(postData || null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Aplica cursor-pointer e lightbox em todas as imagens do conteúdo
  useEffect(() => {
    const imgs = contentRef.current?.querySelectorAll("img");
    imgs?.forEach((img) => {
      img.style.cursor = "pointer";
      img.onclick = () => setLightbox({ open: true, src: img.src, alt: img.alt });
    });
  }, [post?.content]);

  if (loading) {
    return (
      <BlogLayout>
        <main className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
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
      <SEO
        title={`${post.title} | Blog marck0101`}
        description={post.excerpt}
        image={post.coverImage}
        url={`/blog/${post.slug}`}
        type="article"
        publishedAt={post.publishedAt}
      />
      <BlogPostSchema post={post} />

      {lightbox.open && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox({ open: false, src: "", alt: "" })}
        />
      )}

      <main className="max-w-3xl mx-auto px-6 py-10">
        <BackButton />
        <Breadcrumb title={post.title} />

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {post.title}
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {post.category} • {new Date(post.publishedAt).toLocaleDateString()}
        </p>

        <div
          ref={contentRef}
          className="prose prose-lg max-w-none mt-8 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12">
          <SubscribeForm />
        </div>
      </main>
    </BlogLayout>
  );
}
