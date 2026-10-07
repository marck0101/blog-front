// Vercel Serverless Function — pré-renderização de SEO para /blog e /blog/:slug.
//
// O app é uma SPA: sem isto, crawlers recebem um <head> genérico e um <div id="root">
// vazio. Aqui buscamos o index.html estático, injetamos title/meta/canonical/JSON-LD
// do post e o conteúdo em <noscript> (lido por bots sem JS, como GPTBot/ClaudeBot e
// previews de redes sociais), e devolvemos 404 real quando o post não existe.
// O React assume normalmente no navegador (ver src/main.jsx e src/pages/Blog/Post.jsx).

import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  PORTFOLIO_URL,
  HOME_TITLE,
  HOME_DESCRIPTION,
  DEFAULT_IMAGE,
  postUrl,
  postTitle,
  postDescription,
  postSchema,
  blogHomeSchema,
} from "../src/seo/site.js";

const API_URL = process.env.PRERENDER_API_URL || "https://api.blog.marck0101.com.br/api";

let shellCache = null;

function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// JSON seguro dentro de <script>: impede "</script>" e afins de fechar a tag.
function safeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c");
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function getShell(origin) {
  if (shellCache) return shellCache;
  const res = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`index.html → ${res.status}`);
  shellCache = await res.text();
  return shellCache;
}

function headTags({ title, description, url, image, type, robots, extra = "", schema }) {
  const t = esc(title);
  const d = esc(description);
  return [
    `<title data-prerender>${t}</title>`,
    `<meta data-prerender name="description" content="${d}" />`,
    `<meta data-prerender name="robots" content="${esc(robots)}" />`,
    `<meta data-prerender name="author" content="${esc(AUTHOR_NAME)}" />`,
    `<link data-prerender rel="canonical" href="${esc(url)}" />`,
    `<meta data-prerender property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta data-prerender property="og:locale" content="pt_BR" />`,
    `<meta data-prerender property="og:type" content="${type}" />`,
    `<meta data-prerender property="og:title" content="${t}" />`,
    `<meta data-prerender property="og:description" content="${d}" />`,
    `<meta data-prerender property="og:image" content="${esc(image)}" />`,
    `<meta data-prerender property="og:url" content="${esc(url)}" />`,
    `<meta data-prerender name="twitter:card" content="summary_large_image" />`,
    `<meta data-prerender name="twitter:title" content="${t}" />`,
    `<meta data-prerender name="twitter:description" content="${d}" />`,
    `<meta data-prerender name="twitter:image" content="${esc(image)}" />`,
    extra,
    schema
      ? `<script data-prerender type="application/ld+json">${safeJson(schema)}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");
}

function render(shell, head, body) {
  return shell
    .replace(/<!--prerender-head-->[\s\S]*?<!--\/prerender-head-->/, head)
    .replace("<!--prerender-body-->", body);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function postPage(post) {
  const url = postUrl(post);
  const head = headTags({
    title: postTitle(post),
    description: postDescription(post),
    url,
    image: post.coverImage || DEFAULT_IMAGE,
    type: "article",
    robots: "index, follow, max-image-preview:large",
    schema: postSchema(post),
    extra: [
      post.publishedAt &&
        `<meta data-prerender property="article:published_time" content="${esc(post.publishedAt)}" />`,
      post.updatedAt &&
        `<meta data-prerender property="article:modified_time" content="${esc(post.updatedAt)}" />`,
      `<meta data-prerender property="article:author" content="${esc(AUTHOR_NAME)}" />`,
    ]
      .filter(Boolean)
      .join("\n    "),
  });

  // Conteúdo vem do editor do próprio admin (mesmo HTML que o React renderiza).
  const body = `<noscript>
      <article>
        <p><a href="/blog">Blog</a> / ${esc(post.title)}</p>
        <h1>${esc(post.title)}</h1>
        <p>Por <a href="${PORTFOLIO_URL}" rel="author">${esc(AUTHOR_NAME)}</a> · ${esc(post.category || "")} · <time datetime="${esc(post.publishedAt)}">${formatDate(post.publishedAt)}</time></p>
        ${post.content || ""}
      </article>
    </noscript>
    <script>window.__PRERENDERED_POST__=${safeJson(post)}</script>`;

  return { head, body };
}

function homePage(posts) {
  const head = headTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: "index, follow, max-image-preview:large",
    schema: blogHomeSchema(posts),
  });

  const items = posts
    .map(
      (p) =>
        `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a>${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}</li>`
    )
    .join("\n          ");

  const body = `<noscript>
      <h1>${esc(SITE_NAME)}</h1>
      <p>${esc(HOME_DESCRIPTION)} Sobre o autor: <a href="${PORTFOLIO_URL}" rel="author">${esc(AUTHOR_NAME)}</a>.</p>
      <ul>
          ${items}
      </ul>
    </noscript>`;

  return { head, body };
}

function notFoundPage(slug) {
  const head = headTags({
    title: `Post não encontrado | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/blog/${encodeURIComponent(slug)}`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: "noindex",
  });
  return { head, body: "" };
}

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";

  let shell;
  try {
    shell = await getShell(origin);
  } catch (err) {
    console.error("[prerender] shell", err);
    res.status(500).send("Erro ao carregar a página");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    let page;
    let status = 200;

    if (slug) {
      const post = await fetchJson(`${API_URL}/posts/slug/${encodeURIComponent(slug)}`);
      if (post) {
        page = postPage(post);
      } else {
        page = notFoundPage(slug);
        status = 404;
      }
    } else {
      const data = await fetchJson(`${API_URL}/posts/published?page=1&limit=50`);
      page = homePage(data?.posts || []);
    }

    res.setHeader(
      "Cache-Control",
      status === 200
        ? "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=60"
    );
    res.status(status).send(render(shell, page.head, page.body));
  } catch (err) {
    // API fora do ar: entrega a SPA normal em vez de quebrar o site.
    console.error("[prerender]", err);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(shell);
  }
}
