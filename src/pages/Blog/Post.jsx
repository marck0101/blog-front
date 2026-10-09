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
import { contactMethod, setPageContext, trackEvent } from "../../utils/analytics";
import {
  AUTHOR_NAME,
  PORTFOLIO_URL,
  postTitle,
  postDescription,
} from "../../seo/site";

const READ_MARKS = [25, 50, 75, 100];

// Post injetado por api/prerender.js no primeiro carregamento — evita o fetch
// duplicado e o "Carregando..." que causava layout shift.
function getPrerenderedPost(slug) {
  const data = window.__PRERENDERED_POST__;
  return data && data.slug === slug ? data : null;
}

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(() => getPrerenderedPost(slug));
  const [loading, setLoading] = useState(() => !getPrerenderedPost(slug));
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });
  const contentRef = useRef(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    if (post?.slug === slug) return;

    setLoading(true);

    PostsService.getBySlug(slug)
      .then((postData) => {
        if (postData) return postData;
        return PostsService.getPublicById(slug);
      })
      .then((postData) => setPost(postData || null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visualização do post: GA4 (com categoria), Pixel ViewContent (públicos por
  // categoria para remarketing) e tags do Clarity para filtrar gravações
  useEffect(() => {
    if (!post?.slug) return;
    setPageContext({ page_type: "post", post_category: post.category, post_slug: post.slug });
    trackEvent(
      "post_view",
      { post_slug: post.slug, post_category: post.category },
      { pixel: "ViewContent", pixelParams: { content_name: post.title, content_category: post.category, content_type: "article" } }
    );
  }, [post?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Profundidade de leitura do texto (não da página inteira, que inclui rodapé)
  useEffect(() => {
    const el = contentRef.current;
    if (!post?.slug || !el) return;
    const reached = new Set();
    let frame = 0;

    const check = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;
      const seen = ((window.innerHeight - rect.top) / rect.height) * 100;
      READ_MARKS.forEach((mark) => {
        if (seen >= mark && !reached.has(mark)) {
          reached.add(mark);
          trackEvent("post_read", { percent: mark, post_slug: post.slug, post_category: post.category });
        }
      });
      if (reached.size === READ_MARKS.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [post?.slug, post?.content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cliques em links de contato dentro do texto do post (ex.: CTA de WhatsApp)
  const handleContentClick = (e) => {
    const link = e.target.closest?.("a[href]");
    const method = contactMethod(link?.getAttribute("href"));
    if (!method) return;
    trackEvent(
      "contact",
      { method, link_location: "post_content", post_slug: post.slug, post_category: post.category },
      { pixel: "Contact" }
    );
  };

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
        <main className="max-w-3xl mx-auto px-6 py-10 min-h-screen">
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </main>
      </BlogLayout>
    );
  }

  if (!post) {
    return (
      <BlogLayout>
        <SEO title="Post não encontrado" robots="noindex" url={`/blog/${slug}`} />
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
        title={postTitle(post)}
        description={postDescription(post)}
        image={post.coverImage}
        url={`/blog/${post.slug}`}
        type="article"
        publishedAt={post.publishedAt}
        modifiedAt={post.updatedAt}
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

        <p className="text-gray-500 dark:text-gray-300 mt-2">
          Por{" "}
          <a
            href={PORTFOLIO_URL}
            rel="author"
            className="font-medium hover:underline dark:text-gray-100"
          >
            {AUTHOR_NAME}
          </a>{" "}
          • {post.category} •{" "}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
          </time>
        </p>

        <div
          ref={contentRef}
          onClick={handleContentClick}
          className="post-content prose prose-lg max-w-none mt-8 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12">
          <SubscribeForm location="post" postCategory={post.category} />
        </div>
      </main>
    </BlogLayout>
  );
}
