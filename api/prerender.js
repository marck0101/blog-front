// Vercel Serverless Function — pré-renderização de SEO para /blog, /blog/:slug,
// /seasons e /seasons/:slug.
//
// O app é uma SPA: sem isto, crawlers recebem um <head> genérico e um <div id="root">
// vazio. Aqui buscamos o index.html estático, injetamos title/meta/canonical/JSON-LD
// do post e o conteúdo (post: HTML visível no #root; listas: <noscript>) para bots sem
// JS, como GPTBot/ClaudeBot e previews de redes sociais, e devolvemos 404 real quando
// o post não existe.
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
import { coverSrcSet, GRID_SIZES } from "../src/utils/coverSrcSet.js";

// Alturas (px) do header do blog e da linha favoritar/compartilhar do post, que o
// HTML estático reserva para o texto não pular quando o React assumir. No celular
// (< 640px, breakpoint sm do Tailwind) os botões de compartilhar quebram em 3 linhas.
// Medidas no Chrome em 390px e 1280px; mudou o header ou o ShareButtons, medir de novo.
const PLACEHOLDER_CSS = `<style>
      .pr-header{min-height:68px}.pr-actions{min-height:128px}
      @media (min-width:640px){.pr-header{min-height:66px}.pr-actions{min-height:40px}}
    </style>`;

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

// Dado complementar (menu, vitrine): se falhar, o React busca no navegador
function fetchOptional(url) {
  return fetchJson(url).catch((err) => {
    console.error("[prerender]", err.message);
    return null;
  });
}

// Categorias e seasons: header, chips e breadcrumb saem completos no primeiro render
async function sharedData() {
  const [categories, seasons] = await Promise.all([
    fetchOptional(`${API_URL}/categories`),
    fetchOptional(`${API_URL}/seasons`),
  ]);
  return {
    ...(Array.isArray(categories) && { categories }),
    ...(Array.isArray(seasons) && { seasons }),
  };
}

// Lido por src/utils/prerendered.js antes do React montar
function dataScript(data) {
  return `<script>window.__PRERENDERED_DATA__=${safeJson(data)}</script>`;
}

// Capa candidata a LCP: o download começa junto com o JS, sem esperar React + API
function imagePreload(url) {
  if (!url) return "";
  const srcset = coverSrcSet(url);
  return srcset
    ? `<link rel="preload" as="image" href="${esc(url)}" imagesrcset="${esc(srcset)}" imagesizes="${esc(GRID_SIZES)}" fetchpriority="high" />`
    : `<link rel="preload" as="image" href="${esc(url)}" fetchpriority="high" />`;
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

// root: HTML visível dentro do #root (o React substitui ao montar)
function render(shell, head, body, root = "") {
  const html = shell
    .replace(/<!--prerender-head-->[\s\S]*?<!--\/prerender-head-->/, head)
    .replace("<!--prerender-body-->", body);
  return root ? html.replace('<div id="root"></div>', () => `<div id="root">${root}</div>`) : html;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// FAQ em HTML puro (mesmo conteúdo da seção visível e do schema FAQPage)
function faqHtml(items) {
  const faq = cleanFaq(items);
  if (!faq.length) return "";
  return `<section id="faq" class="mt-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Perguntas frequentes</h2>
          ${faq.map((item) => `<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">${esc(item.question)}</h3>\n          <p class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">${esc(item.answer)}</p>`).join("\n          ")}
        </section>`;
}

// Links internos no HTML que os bots leem: sem eles o artigo é um beco sem saída
// para o crawler (o "Continue lendo" e a navegação da season só existem no React)
function linkListHtml(title, posts) {
  if (!posts?.length) return "";
  return `<nav aria-label="${esc(title)}" class="mt-12">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">${esc(title)}</h2>
          <ul class="mt-4 space-y-3">
            ${posts
              .map((p) => `<li><a href="/blog/${esc(p.slug)}" class="font-semibold text-blue-600 dark:text-blue-400 hover:underline">${esc(p.title)}</a>${p.excerpt ? ` <span class="text-gray-600 dark:text-gray-300">— ${esc(p.excerpt)}</span>` : ""}</li>`)
              .join("\n            ")}
          </ul>
        </nav>`;
}

// Fallback para API antiga sem readingMinutes (mesma conta de utils/readingTime)
function readingMinutes(html = "") {
  const words = String(html).replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Mesmo esqueleto e classes de BlogLayout + Post.jsx: o HTML pinta já com a cara
// da página e o React (que monta com o post do __PRERENDERED_POST__, sem esperar a
// API) substitui sem a página pular. Alturas fixas = header e linha de
// favoritar/compartilhar, que só existem no React.
function postArticleHtml(post, { related, episodes, categoryLabel, seasonTitle }) {
  const minutes = post.readingMinutes || readingMinutes(post.content);
  const trail = post.season && seasonTitle
    ? `<span class="mx-2">/</span><a href="/seasons" class="hover:underline dark:hover:text-gray-100">Seasons</a>
          <span class="mx-2">/</span><a href="/seasons/${esc(post.season)}" class="hover:underline dark:hover:text-gray-100">${esc(seasonTitle)}</a>`
    : "";
  const otherEpisodes = episodes?.season ? episodes.posts?.filter((p) => p.slug !== post.slug) : null;

  return `${PLACEHOLDER_CSS}
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div class="pr-header max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/blog" class="font-bold text-lg text-gray-900 dark:text-gray-100 shrink-0">marck0101</a>
        </div>
      </header>
      <div class="flex-1">
        <main class="max-w-3xl mx-auto px-6 py-10">
          <a href="/blog" class="inline-block mb-6 text-sm text-blue-600 dark:text-blue-400 hover:underline">← Voltar para o blog</a>
          <nav aria-label="Você está em" class="text-sm text-gray-500 dark:text-gray-300 mb-6">
            <a href="/blog" class="hover:underline dark:hover:text-gray-100">Blog</a>
            ${trail}
            <span class="mx-2">/</span><span class="text-gray-700 dark:text-gray-100 font-medium">${esc(post.title)}</span>
          </nav>
          <article>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white">${esc(post.title)}</h1>
            <p class="text-gray-500 dark:text-gray-300 mt-2">
              Por <a href="${PORTFOLIO_URL}" rel="author" class="font-medium hover:underline dark:text-gray-100">${esc(AUTHOR_NAME)}</a>
              • <a href="/blog?categoria=${esc(post.category || "")}" class="hover:underline">${esc(categoryLabel || post.category || "")}</a>
              • <time datetime="${esc(post.publishedAt)}">${formatDate(post.publishedAt)}</time>
              • ${minutes} min de leitura
            </p>
            <div class="pr-actions mt-5"></div>
            ${post.directAnswer?.trim()
              ? `<aside aria-label="Resposta direta" class="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/40 px-5 py-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Resposta direta</p>
              <p class="mt-1 text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line">${esc(post.directAnswer.trim())}</p>
            </aside>`
              : ""}
            <div class="post-content prose prose-lg max-w-none mt-8 dark:prose-invert">
              ${post.content || ""}
            </div>
            ${faqHtml(postFaq(post))}
          </article>
          ${otherEpisodes ? linkListHtml(`Season: ${episodes.season.title}`, otherEpisodes) : ""}
          ${linkListHtml("Continue lendo", related)}
        </main>
      </div>
    </div>`;
}

function postPage(post, { related = [], episodes = null, categoryLabel = "", seasonTitle = "" } = {}) {
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
  // Vai visível dentro do #root (não em <noscript>: extratores como o Readability,
  // base de muitos leitores de IA, descartam <noscript>). O React troca tudo no
  // primeiro render; ver postArticleHtml.
  const root = postArticleHtml(post, { related, episodes, categoryLabel, seasonTitle });
  const body = `<script>window.__PRERENDERED_POST__=${safeJson(post)}</script>`;

  return { head, body, root };
}

// home: { posts, pinned }; preload só sem filtro, quando a vitrine aparece
function homePage(home, withPreload) {
  const posts = [...home.pinned, ...home.posts];
  const head = headTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: blogHomeSchema(posts),
    // Com fixados, a capa do 1º é a maior imagem visível ao abrir (ver BlogHome)
    extra: withPreload ? imagePreload(home.pinned[0]?.coverImage) : "",
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
    // Em paralelo com a busca principal de cada rota
    const shared = sharedData();
    const data = {};

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
        // Selo da season no topo do post (SeasonNav) e "Continue lendo": entram no
        // HTML como links e vão prontos para o React (sem buscar de novo)
        const [episodes, related] = await Promise.all([
          post.season ? fetchOptional(`${API_URL}/posts/season/${encodeURIComponent(post.season)}`) : null,
          fetchOptional(`${API_URL}/posts/public/${encodeURIComponent(post._id)}/related`),
        ]);
        if (episodes) data.seasonEpisodes = episodes;
        if (Array.isArray(related)) data.related = { postId: post._id, posts: related };
        const { categories = [], seasons = [] } = await shared;
        page = postPage(post, {
          related: Array.isArray(related) ? related : [],
          episodes,
          categoryLabel: categories.find((c) => c.slug === post.category)?.label,
          seasonTitle: seasons.find((s) => s.slug === post.season)?.title || episodes?.season?.title,
        });
      } else {
        page = notFoundPage(slug);
        status = 404;
      }
    } else {
      // limit 48 = maior opção de "itens por página" da BlogHome: serve qualquer escolha
      const [list, pinned, highlights] = await Promise.all([
        fetchJson(`${API_URL}/posts/published?page=1&limit=48&excludePinned=1&fields=card`),
        fetchOptional(`${API_URL}/posts/pinned`),
        fetchOptional(`${API_URL}/posts/highlights`),
      ]);
      // Lista e vitrine só valem para /blog sem filtro (com ?categoria=, ?q=… a
      // BlogHome busca no navegador). Sem fixados/destaques (falha da API), idem.
      const defaultView = !["categoria", "q", "pagina", "ordem"].some((key) => key in req.query);
      // Card não usa o conteúdo; garante isso mesmo com uma API que ignore fields=card
      const posts = (list?.posts || []).map(({ content, ...card }) => card); // eslint-disable-line no-unused-vars
      if (defaultView && Array.isArray(pinned) && Array.isArray(highlights)) {
        data.home = { posts, total: list?.total || 0, pinned, highlights };
      }
      page = homePage({ posts, pinned: pinned || [] }, defaultView);
    }

    Object.assign(data, await shared);
    page.body += `\n    ${dataScript(data)}`;

    res.setHeader(
      "Cache-Control",
      !shell.fresh
        ? "no-store"
        : status === 200
        ? "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=60"
    );
    res.status(status).send(render(shell.html, page.head, page.body, page.root));
  } catch (err) {
    // API fora do ar: entrega a SPA normal em vez de quebrar o site.
    console.error("[prerender]", err);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(shell.html);
  }
}
