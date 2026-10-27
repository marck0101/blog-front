// Fonte única de metadados de SEO do blog.
// Módulo JS puro: importado pelo React (Helmet) e pela função serverless api/prerender.js.

export const SITE_URL = "https://blog.marck0101.com.br";
export const PORTFOLIO_URL = "https://marck0101.com.br/";
export const SITE_NAME = "Blog do Marcos Henrique Corrêa";
export const AUTHOR_NAME = "Marcos Henrique Corrêa";
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

export const HOME_TITLE = "Marcos Henrique Corrêa | Blog de marketing, tráfego e dev";
export const HOME_DESCRIPTION =
  "Blog do Marcos Henrique Corrêa, desenvolvedor full stack e gestor de tráfego: artigos práticos sobre marketing digital, tráfego pago, growth e tecnologia.";

// Mesmo @id usado no portfólio — o Google consolida as duas páginas na mesma entidade.
export const PERSON_ID = `${PORTFOLIO_URL}#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const PERSON = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: AUTHOR_NAME,
  alternateName: ["Marcos Corrêa", "Marcos Henrique Correa", "Marcos Henrique", "marck0101"],
  url: PORTFOLIO_URL,
  image: `${PORTFOLIO_URL}marcos-henrique-correa.webp`,
  jobTitle: "Desenvolvedor Full Stack & Gestor de Tráfego",
  sameAs: [
    "https://github.com/marck0101",
    "https://www.linkedin.com/in/marcos-henrique-corr%C3%AAa-618392209/",
    SITE_URL,
  ],
};

export function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function postUrl(post) {
  return `${SITE_URL}/blog/${post.slug}`;
}

// Google corta o título em ~60 caracteres; o sufixo com o autor só entra se couber.
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

export function postTitle(post) {
  if (post.seo?.title) return post.seo.title;
  const withAuthor = `${post.title} | ${AUTHOR_NAME}`;
  return withAuthor.length <= TITLE_MAX ? withAuthor : post.title;
}

export function postDescription(post) {
  return (
    post.seo?.description ||
    post.excerpt ||
    truncate(stripHtml(post.content), 160)
  );
}

export function blogHomeSchema(posts = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_URL}/blog`,
        name: SITE_NAME,
        alternateName: "marck0101",
        inLanguage: "pt-BR",
        publisher: { "@id": PERSON_ID },
      },
      {
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        url: `${SITE_URL}/blog`,
        name: SITE_NAME,
        description: HOME_DESCRIPTION,
        inLanguage: "pt-BR",
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: postUrl(p),
          datePublished: p.publishedAt,
          author: { "@id": PERSON_ID },
        })),
      },
      PERSON,
    ],
  };
}

// Perguntas frequentes do post (campo "faq" do admin), sem pares incompletos
export function postFaq(post) {
  return (post.faq || []).filter((item) => item?.question?.trim() && item?.answer?.trim());
}

// O mesmo FAQ que o leitor vê no fim do post (o Google exige que o conteúdo esteja visível)
function faqPageSchema(post) {
  const pairs = postFaq(post);
  if (pairs.length === 0) return null;

  return {
    "@type": "FAQPage",
    "@id": `${postUrl(post)}#faq`,
    mainEntity: pairs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function postSchema(post) {
  const url = postUrl(post);
  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: truncate(post.title, 110),
      description: postDescription(post),
      image: post.coverImage
        ? [
            post.coverImageAlt
              ? { "@type": "ImageObject", url: post.coverImage, caption: post.coverImageAlt }
              : post.coverImage,
          ]
        : [DEFAULT_IMAGE],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      inLanguage: "pt-BR",
      articleSection: post.category,
      mainEntityOfPage: url,
      url,
      isPartOf: { "@id": WEBSITE_ID },
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 2, name: post.title, item: url },
      ],
    },
    PERSON,
  ];

  const faq = faqPageSchema(post);
  if (faq) graph.push(faq);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
