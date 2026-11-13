import { Link, useNavigate, useParams } from "react-router-dom";
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
import SeasonNav from "../../components/SeasonNav";
import SubscriberService from "../../services/subscriber.service";
import SeasonsService from "../../services/seasons.service";
import {
  AUTHOR_NAME,
  PORTFOLIO_URL,
  SITE_URL,
  postTitle,
  postDescription,
} from "../../seo/site";
import { readingMinutes } from "../../utils/readingTime";
import { markEpisodeRead } from "../../utils/seasonProgress";
import { recordShareVisit } from "../../utils/share";
import { recordPostView } from "../../utils/postViews";
import FavoriteButton from "../../components/FavoriteButton";
import ShareButtons from "../../components/ShareButtons";
import Comments from "../../components/Comments";
import RelatedPosts from "../../components/RelatedPosts";
import PostFaq from "../../components/PostFaq";
import DirectAnswer from "../../components/DirectAnswer";
import TerminalOffer from "../../components/TerminalOffer";
import { prerendered, readBlock } from "../../utils/prerendered";
import { safeHtml } from "../../utils/safeHtml";
import { Loading, Skeleton } from "../../components/Skeleton";

const READ_MARKS = [25, 50, 75, 100];
// Episódio de season conta como lido a partir de 75% do texto
const SEASON_READ_PERCENT = 75;

// Quanto do texto já passou pela tela (0–100+)
function percentSeen(el) {
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  return ((window.innerHeight - rect.top) / rect.height) * 100;
}

// Post injetado por api/prerender.js no primeiro carregamento — evita o fetch
// duplicado e o "Carregando..." que causava layout shift.
function getPrerenderedPost(slug) {
  const data = readBlock("prerendered-post");
  return data && data.slug === slug ? data : null;
}

// Link do texto para outra página do blog: o endereço que o React Router abre
// sem recarregar (também aceita o link absoluto blog.marck0101.com.br/...).
// Admin, API e arquivos (sitemap, rss) seguem como link normal.
const INTERNAL_PATH = /^\/(blog|seasons|favoritos|privacidade)(\/|$)/;

function internalPath(href) {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const sameSite = url.origin === window.location.origin || url.origin === SITE_URL;
  if (!sameSite || !INTERNAL_PATH.test(url.pathname) || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  return url.pathname + url.search + url.hash;
}

// Prerender já respondeu 404 para este slug — não buscar de novo na API
function isPrerenderedNotFound(slug) {
  return readBlock("prerendered-not-found") === slug;
}

export default function Post() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Resultado da última busca: { slug pedido, post } (post null = não existe).
  // Começa com o que o prerender já mandou, quando há.
  const [result, setResult] = useState(() => {
    if (getPrerenderedPost(slug)) return { slug, post: getPrerenderedPost(slug) };
    if (isPrerenderedNotFound(slug)) return { slug, post: null };
    return null;
  });
  const post = result?.post ?? null;
  // Carregando = ainda não há resposta para este endereço. No endereço antigo
  // redirecionado (BIZ-04), o post recebido já é o do endereço novo.
  const hasAnswer = (r) => r?.slug === slug || r?.post?.slug === slug;
  const loading = Boolean(slug) && !hasAnswer(result);
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });
  const contentRef = useRef(null);
  // Nomes para exibir: "Negócios" em vez do slug, título da season no breadcrumb
  // Do prerender quando houver: breadcrumb e categoria não mudam depois do primeiro render
  const [categories, setCategories] = useState(() => prerendered("categories") || []);
  const [seasons, setSeasons] = useState(() => prerendered("seasons") || []);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
    SeasonsService.getPublic().then(setSeasons).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug || hasAnswer(result)) return;

    // Navegou para outro post antes de chegar a resposta: a antiga é descartada
    let current = true;
    PostsService.getBySlug(slug)
      .then((postData) => {
        if (postData) return postData;
        // Links antigos por ID; um slug comum daria 400 na rota por ID
        return /^[a-f0-9]{24}$/i.test(slug) ? PostsService.getPublicById(slug) : null;
      })
      .catch(() => null)
      .then((postData) => {
        if (!current) return;
        setResult({ slug, post: postData || null });
        // Endereço antigo (ou link por id): a barra de endereço passa a mostrar o atual
        if (postData?.slug && postData.slug !== slug) {
          navigate(`/blog/${postData.slug}${window.location.search}`, { replace: true });
        }
      });
    return () => {
      current = false;
    };
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
    // Leitura do post (contador do blog: Vitrine, destaques, "Continue lendo")
    recordPostView(post);
    // Chegou por link compartilhado (utm_medium=share): conta para o canal
    recordShareVisit(post);
  }, [post?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Profundidade de leitura do texto (não da página inteira, que inclui rodapé)
  useEffect(() => {
    const el = contentRef.current;
    if (!post?.slug || !el) return;
    const reached = new Set();
    let frame = 0;

    const check = () => {
      frame = 0;
      const seen = percentSeen(el);
      if (seen <= 0) return;
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

  // Progresso da season (localStorage): marca o episódio como lido. Confere também
  // ao abrir, para post curto que cabe na tela sem rolar.
  useEffect(() => {
    const el = contentRef.current;
    if (!post?.season || !el) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (percentSeen(el) >= SEASON_READ_PERCENT) {
        markEpisodeRead(post.season, post.slug);
        window.removeEventListener("scroll", onScroll);
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };

    frame = requestAnimationFrame(check);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [post?.slug, post?.season, post?.content]);

  // Cliques em links de contato dentro do texto do post (ex.: CTA de WhatsApp)
  // Links internos no meio do texto: navegação do app (sem recarregar) + evento
  // para medir a interlinkagem. Ctrl/Cmd+clique e target=_blank abrem em outra aba.
  const openInternalLink = (e, link) => {
    if (!link || e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return false;
    const path = internalPath(link.getAttribute("href"));
    if (!path) return false;
    e.preventDefault();
    trackEvent("internal_link_click", {
      link_location: "post_content",
      post_slug: post.slug,
      target_path: path,
    });
    navigate(path);
    return true;
  };

  const handleContentClick = (e) => {
    const link = e.target.closest?.("a[href]");
    if (openInternalLink(e, link)) return;
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
        {/* Mesmo desenho do post: voltar, trilha, título, autor/data, ações e texto */}
        <main className="max-w-3xl mx-auto px-6 py-10 min-h-screen">
          <Loading label="Carregando post">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-48 mt-4 mb-4" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3 mt-2" />
            <Skeleton className="h-5 w-80 max-w-full mt-3" />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-9 w-28" rounded="rounded-full" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-9" rounded="rounded-full" />)}
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Skeleton className="w-full aspect-video mb-6" rounded="rounded-xl" />
              {["w-full", "w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
                <Skeleton key={i} className={`h-5 ${w}`} />
              ))}
            </div>
          </Loading>
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

  const categoryLabel = categories.find((c) => c.slug === post.category)?.label || post.category;
  const season = post.season ? seasons.find((s) => s.slug === post.season) : null;
  const minutes = readingMinutes(post.content);

  return (
    <BlogLayout activeNav={post.season ? "seasons" : post.category}>
      <SEO
        title={postTitle(post)}
        description={postDescription(post)}
        image={post.coverImage}
        imageAlt={post.coverImageAlt}
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

      <TerminalOffer category={post.category} />

      <main className="skin-post max-w-3xl mx-auto px-6 py-10">
        <BackButton />
        <Breadcrumb
          title={post.title}
          trail={
            season
              ? [
                  { label: "Seasons", to: "/seasons" },
                  { label: season.title, to: `/seasons/${season.slug}` },
                ]
              : []
          }
        />

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {post.title}
        </h1>

        <p className="skin-meta text-gray-500 dark:text-gray-300 mt-2">
          Por{" "}
          <a
            href={PORTFOLIO_URL}
            rel="author"
            className="font-medium hover:underline dark:text-gray-100"
          >
            {AUTHOR_NAME}
          </a>{" "}
          •{" "}
          <Link
            to={`/blog?categoria=${post.category}`}
            className="hover:underline hover:text-gray-800 dark:hover:text-gray-100"
          >
            {categoryLabel}
          </Link>{" "}
          •{" "}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
          </time>{" "}
          • {minutes} min de leitura
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <FavoriteButton post={post} location="post_top" />
          <ShareButtons post={post} location="post_top" />
        </div>

        <SeasonNav post={post} variant="badge" />

        <DirectAnswer text={post.directAnswer} />

        <div
          ref={contentRef}
          onClick={handleContentClick}
          className="post-content prose prose-lg max-w-none mt-8 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: safeHtml(post.content) }}
        />

        <PostFaq post={post} />

        <SeasonNav post={post} />

        <div className="mt-10 py-5 border-y border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <ShareButtons post={post} location="post_bottom" title="Gostou? Mande para alguém" />
          <FavoriteButton post={post} location="post_bottom" />
        </div>

        <RelatedPosts key={`related-${post._id}`} post={post} categories={categories} seasons={seasons} />

        <div className="mt-12">
          <SubscribeForm location="post" postCategory={post.category} postSlug={post.slug} compact />
        </div>

        <Comments key={`comments-${post._id}`} post={post} />
      </main>
    </BlogLayout>
  );
}
