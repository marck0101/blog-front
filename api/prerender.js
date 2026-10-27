// Vercel Serverless Function — pré-renderização de SEO para /blog, /blog/:slug,
// /seasons e /seasons/:slug.
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
  postFaq,
  postSchema,
  blogHomeSchema,
  seasonUrl,
  seasonsIndexSchema,
  seasonSchema,
  cleanFaq,
  ROBOTS_INDEX,
  BLOG_FAQ,
  SEASONS_FAQ,
  SEASONS_DESCRIPTION,
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

// Busca o index.html pelo domínio público — o host interno da função (*.vercel.app)
// fica atrás da Deployment Protection e devolveria a tela de login da Vercel.
// SHELL_ORIGIN permite apontar previews para outro host, se necessário.
const SHELL_ORIGIN = process.env.PRERENDER_SHELL_ORIGIN || SITE_URL;
const SHELL_MARKER = "<!--prerender-head-->";

// O shell fica em memória por pouco tempo e só se os assets dele existirem: durante
// um deploy, o domínio ainda pode servir o index.html do deploy anterior, cujos
// /assets/index-*.js somem quando o novo assume (página em branco, 404 nos assets).
const SHELL_TTL_MS = 60_000;

async function fetchShell(bust) {
  const url = `${SHELL_ORIGIN}/index.html${bust ? `?v=${Date.now()}` : ""}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) throw new Error(`index.html → ${res.status}`);
  const html = await res.text();
  // Nunca servir (nem cachear) algo que não seja o shell do app.
  if (!html.includes(SHELL_MARKER) || !html.includes('id="root"')) {
    throw new Error("index.html inválido (sem marcador de prerender)");
  }
  return html;
}

// O JS principal do shell responde no domínio público (o mesmo que o navegador usa)?
async function assetsLive(html) {
  const script = html.match(/<script[^>]+src="(\/assets\/[^"]+\.js)"/)?.[1];
  if (!script) return true;
  const res = await fetch(`${SHELL_ORIGIN}${script}`, { method: "HEAD", signal: AbortSignal.timeout(4000) });
  return res.ok;
}

// { html, fresh }: fresh = false quando não deu para confirmar os assets (não cachear a resposta)
async function getShell() {
  if (shellCache && Date.now() - shellCache.at < SHELL_TTL_MS) return { html: shellCache.html, fresh: true };
  shellCache = null;

  for (const bust of [false, true]) {
    const html = await fetchShell(bust);
    if (await assetsLive(html).catch(() => false)) {
      shellCache = { html, at: Date.now() };
      return { html, fresh: true };
    }
  }
  console.error("[prerender] assets do index.html não respondem (deploy em andamento?)");
  return { html: await fetchShell(true), fresh: false };
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

// FAQ em HTML puro (mesmo conteúdo da seção visível e do schema FAQPage)
function faqHtml(items) {
  const faq = cleanFaq(items);
  if (!faq.length) return "";
  return `<section>
          <h2>Perguntas frequentes</h2>
          ${faq.map((item) => `<h3>${esc(item.question)}</h3>\n          <p>${esc(item.answer)}</p>`).join("\n          ")}
        </section>`;
}

function postPage(post) {
  const url = postUrl(post);
  const head = headTags({
    title: postTitle(post),
    description: postDescription(post),
    url,
    image: post.coverImage || DEFAULT_IMAGE,
    type: "article",
    robots: ROBOTS_INDEX,
    schema: postSchema(post),
    extra: [
      post.publishedAt &&
        `<meta data-prerender property="article:published_time" content="${esc(post.publishedAt)}" />`,
      post.updatedAt &&
        `<meta data-prerender property="article:modified_time" content="${esc(post.updatedAt)}" />`,
      `<meta data-prerender property="article:author" content="${esc(AUTHOR_NAME)}" />`,
      post.coverImage && post.coverImageAlt &&
        `<meta data-prerender property="og:image:alt" content="${esc(post.coverImageAlt)}" />`,
      post.coverImage && post.coverImageAlt &&
        `<meta data-prerender name="twitter:image:alt" content="${esc(post.coverImageAlt)}" />`,
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
        ${faqHtml(postFaq(post))}
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
    robots: ROBOTS_INDEX,
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
      <p><a href="/seasons">Seasons: séries de artigos em sequência</a></p>
      ${faqHtml(BLOG_FAQ)}
    </noscript>`;

  return { head, body };
}

function seasonsIndexPage(seasons) {
  const head = headTags({
    title: `Seasons | ${AUTHOR_NAME}`,
    description: SEASONS_DESCRIPTION,
    url: `${SITE_URL}/seasons`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: seasonsIndexSchema(seasons),
  });

  const items = seasons
    .map(
      (s) =>
        `<li><a href="/seasons/${esc(s.slug)}">${esc(s.title)}</a> (${s.episodes} episódios)${s.description ? ` — ${esc(s.description)}` : ""}</li>`
    )
    .join("\n          ");

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / Seasons</p>
      <h1>Assuntos em sequência, do básico ao avançado</h1>
      <p>${esc(SEASONS_DESCRIPTION)}</p>
      <ul>
          ${items}
      </ul>
      ${faqHtml(SEASONS_FAQ)}
    </noscript>`;

  return { head, body };
}

function seasonPage({ season, posts }) {
  const description = season.description || `Season com ${posts.length} artigos sobre ${season.title}.`;
  const head = headTags({
    title: `${season.title} | Season | ${AUTHOR_NAME}`,
    description,
    url: seasonUrl(season),
    image: posts[0]?.coverImage || DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: seasonSchema(season, posts),
  });

  const items = posts
    .map(
      (p, i) =>
        `<li>Episódio ${i + 1}: <a href="/blog/${esc(p.slug)}">${esc(p.title)}</a>${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}</li>`
    )
    .join("\n          ");

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / <a href="/seasons">Seasons</a> / ${esc(season.title)}</p>
      <h1>${esc(season.title)}</h1>
      <p>${esc(description)}</p>
      <ol>
          ${items}
      </ol>
      ${faqHtml(season.faq)}
    </noscript>`;

  return { head, body };
}

// path: "blog" (post) ou "seasons"
function notFoundPage(slug, path = "blog") {
  const head = headTags({
    title: `${path === "seasons" ? "Season não encontrada" : "Post não encontrado"} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/${path}/${encodeURIComponent(slug)}`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: "noindex",
  });
  // Avisa o React que o post não existe — evita refazer a busca (e um 404 a mais no console)
  const body = path === "blog" ? `<script>window.__PRERENDERED_NOT_FOUND__=${safeJson(slug)}</script>` : "";
  return { head, body };
}

export default async function handler(req, res) {
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const seasonSlug = typeof req.query.season === "string" ? req.query.season : "";
  const isSeasons = req.query.page === "seasons";

  let shell;
  try {
    shell = await getShell();
  } catch (err) {
    console.error("[prerender] shell", err);
    res.setHeader("Cache-Control", "no-store");
    res.status(503).send("Página temporariamente indisponível. Tente novamente em instantes.");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    let page;
    let status = 200;

    if (seasonSlug) {
      const data = await fetchJson(`${API_URL}/seasons/${encodeURIComponent(seasonSlug)}`);
      if (data) {
        page = seasonPage(data);
      } else {
        page = notFoundPage(seasonSlug, "seasons");
        status = 404;
      }
    } else if (isSeasons) {
      page = seasonsIndexPage((await fetchJson(`${API_URL}/seasons`)) || []);
    } else if (slug) {
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
      !shell.fresh
        ? "no-store"
        : status === 200
        ? "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=60"
    );
    res.status(status).send(render(shell.html, page.head, page.body));
  } catch (err) {
    // API fora do ar: entrega a SPA normal em vez de quebrar o site.
    console.error("[prerender]", err);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(shell.html);
  }
}
