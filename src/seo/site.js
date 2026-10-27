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

// Meta robots das páginas indexáveis. max-snippet/max-video-preview -1 liberam
// trechos e prévias completos (Google, AI Overviews e afins); o robots.txt é um só,
// por domínio (public/robots.txt).
export const ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

// FAQ da home (/blog#faq). Fixo no código: muda pouco e vale para o blog inteiro.
export const BLOG_FAQ = [
  {
    question: "Sobre o que é o blog do Marcos Henrique Corrêa?",
    answer:
      "Sobre a interseção entre tecnologia e performance: artigos práticos de marketing digital, tráfego pago, growth e desenvolvimento, com decisões reais e o porquê de cada uma.",
  },
  {
    question: "Quem escreve os artigos?",
    answer:
      "Marcos Henrique Corrêa, desenvolvedor full stack e gestor de tráfego. Ele entrou no marketing como dev e hoje combina as duas áreas: estratégia de mídia paga e implementação técnica de rastreamento, dashboards e sistemas.",
  },
  {
    question: "O que são as seasons do blog?",
    answer:
      "São séries de artigos que se complementam, como episódios. Lidas em ordem, levam um assunto do básico ao avançado. Todas ficam reunidas em /seasons.",
  },
  {
    question: "Como recebo os novos artigos?",
    answer:
      "Assinando a newsletter no fim da página. Você escolhe as categorias que quer receber e pode sair a qualquer momento pelo link de descadastro de cada email.",
  },
  {
    question: "Como entro em contato com o autor?",
    answer: "Pelo link Contato no rodapé de qualquer página do blog, que abre um email direto para o Marcos.",
  },
];

// FAQ da página /seasons
export const SEASONS_FAQ = [
  {
    question: "O que é uma season?",
    answer:
      "É uma série de artigos sobre o mesmo assunto, publicada em episódios. Cada episódio prepara o próximo, do básico ao avançado.",
  },
  {
    question: "Preciso ler os episódios em ordem?",
    answer:
      "É o recomendado, porque cada episódio parte do anterior. Mas cada artigo também se sustenta sozinho, se você quiser ir direto a um tema.",
  },
  {
    question: "Como o blog sabe em qual episódio eu parei?",
    answer:
      "O progresso fica salvo no seu próprio navegador, sem cadastro: um episódio conta como lido quando você passa de 75% do texto. A página da season mostra de onde continuar.",
  },
];

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
      faqPageSchema(BLOG_FAQ, `${SITE_URL}/blog#faq`),
    ],
  };
}

export function seasonUrl(season) {
  return `${SITE_URL}/seasons/${season.slug}`;
}

// Página /seasons: coleção das séries + FAQ
export function seasonsIndexSchema(seasons = []) {
  const url = `${SITE_URL}/seasons`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: `Seasons | ${SITE_NAME}`,
        description: SEASONS_DESCRIPTION,
        inLanguage: "pt-BR",
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@id": PERSON_ID },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: seasons.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: seasonUrl(s),
            name: s.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 2, name: "Seasons", item: url },
        ],
      },
      PERSON,
      faqPageSchema(SEASONS_FAQ, `${url}#faq`),
    ],
  };
}

// Página de uma season: episódios em ordem + FAQ da season (campo do admin)
export function seasonSchema(season, posts = []) {
  const url = seasonUrl(season);
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: season.title,
      description: season.description || `Season com ${posts.length} artigos sobre ${season.title}.`,
      inLanguage: "pt-BR",
      isPartOf: { "@id": WEBSITE_ID },
      author: { "@id": PERSON_ID },
      mainEntity: {
        "@type": "ItemList",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: postUrl(p),
          name: p.title,
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 2, name: "Seasons", item: `${SITE_URL}/seasons` },
        { "@type": "ListItem", position: 3, name: season.title, item: url },
      ],
    },
    PERSON,
  ];
  const faq = faqPageSchema(cleanFaq(season.faq), `${url}#faq`);
  if (faq) graph.push(faq);
  return { "@context": "https://schema.org", "@graph": graph };
}

export const SEASONS_DESCRIPTION =
  "Séries de artigos que se complementam: comece pelo primeiro episódio e avance do básico ao avançado.";

// Pares pergunta/resposta completos (FAQ editado no admin pode ter linha vazia)
export function cleanFaq(items) {
  return (items || []).filter((item) => item?.question?.trim() && item?.answer?.trim());
}

// Perguntas frequentes do post (campo "faq" do admin)
export function postFaq(post) {
  return cleanFaq(post.faq);
}

// O mesmo FAQ que o leitor vê na página (o Google exige que o conteúdo esteja visível)
function faqPageSchema(items, id) {
  const pairs = cleanFaq(items);
  if (pairs.length === 0) return null;

  return {
    "@type": "FAQPage",
    "@id": id,
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

  const faq = faqPageSchema(post.faq, `${url}#faq`);
  if (faq) graph.push(faq);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
