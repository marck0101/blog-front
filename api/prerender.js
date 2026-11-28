// Vercel Serverless Function — pré-renderização de SEO para /blog, /blog/:slug,
// /seasons, /seasons/:slug, /temas/:slug, /sobre, /pre-diagnostico e /privacidade.
//
// O app é uma SPA: sem isto, crawlers recebem um <head> genérico e um <div id="root">
// vazio. Aqui buscamos o index.html estático, injetamos title/meta/canonical/JSON-LD
// do post e o conteúdo (post: HTML visível no #root; listas: <noscript>) para bots sem
// JS, como GPTBot/ClaudeBot e previews de redes sociais, e devolvemos 404 real quando
// o post não existe.
// O React assume normalmente no navegador (ver src/main.jsx e src/pages/Blog/Post.jsx).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  PORTFOLIO_URL,
  HOME_TITLE,
  HOME_DESCRIPTION,
  DEFAULT_IMAGE,
  postImage,
  postUrl,
  postTitle,
  postDescription,
  postFaq,
  postSchema,
  blogHomeSchema,
  seasonUrl,
  seasonsIndexSchema,
  seasonSchema,
  clusterUrl,
  clusterTitle,
  clusterSchema,
  cleanFaq,
  ROBOTS_INDEX,
  resolveSiteFaq,
  SEASONS_DESCRIPTION,
} from "../src/seo/site.js";
import { ABOUT_DESCRIPTION, ABOUT_HTML, ABOUT_TITLE, ABOUT_URL, aboutSchema } from "../src/seo/about.js";
import { PRE_DESCRIPTION, PRE_FAQ, PRE_H1, PRE_CHECKS, PRE_STEPS, PRE_NOT, PRE_NOT_NOTE, PRE_TITLE, PRE_URL, preDiagnosticoSchema } from "../src/seo/preDiagnostico.js";
import { PRIVACY_DESCRIPTION, PRIVACY_HTML, PRIVACY_TITLE, PRIVACY_UPDATED } from "../src/seo/privacy.js";
import { coverSrcSet, GRID_SIZES } from "../src/utils/coverSrcSet.js";
import { authorNumbered, tocItems, withHeadingIds } from "../src/utils/headings.js";
import { clusterLinks } from "../src/utils/clusterLinks.js";
import { SERVICES_INTRO, SERVICES_TITLE, servicesForCluster } from "../src/utils/clusterServices.js";

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

// FAQ da home e de /seasons (fonte única na API, OPS-01). Falhou ou veio fora do
// formato: null, e as páginas usam a reserva embutida em src/seo/site.js (o FAQ nunca
// some do HTML nem do schema). Roda em paralelo com a busca principal da rota.
async function fetchSiteFaq() {
  const raw = await fetchOptional(`${API_URL}/site/faq`);
  return raw && typeof raw === "object" ? resolveSiteFaq(raw) : null;
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

// Dados para o React como bloco JSON (não executável): a CSP não precisa liberar
// script inline (SEC-02). Lido por src/utils/prerendered.js (readBlock).
function jsonBlock(id, data) {
  return `<script type="application/json" id="${id}">${safeJson(data)}</script>`;
}

// Lido por src/utils/prerendered.js antes do React montar
function dataScript(data) {
  return jsonBlock("prerendered-data", data);
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

// Shell do próprio deploy: o dist/index.html empacotado com a função (includeFiles no
// vercel.json). Os assets dele são sempre os do deploy que está respondendo, então
// a corrida acima não acontece. Em 27/11/2026 a busca pelo domínio pegou o shell do
// deploy anterior, que ficou no cache da CDN (s-maxage=600) e deixou o /blog em
// branco por ~8 min. Sem o arquivo (dev, testes), cai na busca pelo domínio.
let localShell = null; // { path, html } — html null = não existe ou é inválido

async function readLocalShell() {
  const file = process.env.PRERENDER_SHELL_FILE || join(process.cwd(), "dist", "index.html");
  if (localShell?.path === file) return localShell.html;
  let html = null;
  try {
    const text = await readFile(file, "utf8");
    if (text.includes(SHELL_MARKER) && text.includes('id="root"')) html = text;
  } catch {
    /* sem arquivo: usa a busca pelo domínio */
  }
  localShell = { path: file, html };
  return html;
}

// { html, fresh, source }: fresh = false quando não deu para confirmar os assets (não cachear a resposta)
async function getShell() {
  const local = await readLocalShell();
  if (local) return { html: local, fresh: true, source: "local" };
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
// da página e o React (que monta com o post do bloco prerendered-post, sem esperar a
// API) substitui sem a página pular. Alturas fixas = header e linha de
// favoritar/compartilhar, que só existem no React.
function postArticleHtml(post, { related, episodes, categoryLabel, seasonTitle, features, cluster }) {
  const minutes = post.readingMinutes || readingMinutes(post.content);
  // Tema do post (mesma regra do React: utils/clusterLinks.js)
  const links = clusterLinks(post, cluster);
  const postService = servicesForCluster(post.cluster)[0];
  const trail = post.season && seasonTitle
    ? `<span class="mx-2">/</span><a href="/seasons" class="hover:underline dark:hover:text-gray-100">Seasons</a>
          <span class="mx-2">/</span><a href="/seasons/${esc(post.season)}" class="hover:underline dark:hover:text-gray-100">${esc(seasonTitle)}</a>`
    : cluster?.cluster && post.cluster === cluster.cluster.slug
    ? `<span class="mx-2">/</span><a href="/temas/${esc(cluster.cluster.slug)}" class="hover:underline dark:hover:text-gray-100">${esc(cluster.cluster.title)}</a>`
    : "";
  const otherEpisodes = episodes?.season ? episodes.posts?.filter((p) => p.slug !== post.slug) : null;
  // Mesmas âncoras e mesmo sumário do React (PostToc), para não pular ao montar
  const body = withHeadingIds(post.content || "");
  // Sumário desligado no painel (Recursos do blog): também fora do HTML
  const toc = features?.toc === false ? [] : tocItems(body.headings);

  return `${PLACEHOLDER_CSS}
    <div class="skin-root min-h-screen flex flex-col">
      <header class="skin-header sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div class="pr-header max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/blog" class="skin-logo font-bold text-lg text-gray-900 dark:text-gray-100 shrink-0">marck0101</a>
        </div>
      </header>
      <div class="flex-1">
        <main class="skin-post max-w-3xl mx-auto px-6 py-10">
          <a href="/blog" class="inline-block mb-6 text-sm text-blue-600 dark:text-blue-400 hover:underline">← Voltar para o blog</a>
          <nav aria-label="Você está em" class="text-sm text-gray-500 dark:text-gray-300 mb-6">
            <a href="/blog" class="hover:underline dark:hover:text-gray-100">Blog</a>
            ${trail}
            <span class="mx-2">/</span><span class="text-gray-700 dark:text-gray-100 font-medium">${esc(post.title)}</span>
          </nav>
          <article>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white">${esc(post.title)}</h1>
            <p class="skin-meta text-gray-500 dark:text-gray-300 mt-2">
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
            ${toc.length
              ? `<nav aria-label="Sumário do post" class="skin-toc mt-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <details open>
                <summary class="cursor-pointer select-none px-5 py-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"><svg width="18" height="18" aria-hidden="true"></svg>Neste post <span class="font-normal text-sm text-gray-500 dark:text-gray-400">(${toc.length} seções)</span></summary>
                <ol class="px-5 pb-4 space-y-1.5 ${authorNumbered(toc) ? "list-none" : "list-decimal list-inside marker:text-gray-400"}">
                  ${toc.map((h) => `<li class="text-gray-700 dark:text-gray-300"><a href="#${esc(h.id)}" class="hover:underline">${esc(h.text)}</a></li>`).join("")}
                </ol>
              </details>
            </nav>`
              : ""}
            <div class="post-content prose prose-lg max-w-none mt-8 dark:prose-invert">
              ${body.html}
            </div>
            ${faqHtml(postFaq(post))}
          </article>
          ${otherEpisodes ? linkListHtml(`Season: ${episodes.season.title}`, otherEpisodes) : ""}
          ${links ? linkListHtml(`${links.isPillar ? "Neste tema" : "Mais deste tema"}: ${links.cluster.title}`, [links.pillar, ...links.items].filter(Boolean)) : ""}
          ${postService ? `<p>Serviço relacionado: <a href="${esc(postService.url)}">${esc(postService.name)}</a></p>` : ""}
          ${linkListHtml("Continue lendo", related)}
        </main>
      </div>
    </div>`;
}

export function postPage(post, { related = [], episodes = null, categoryLabel = "", seasonTitle = "", features = null, cluster = null } = {}) {
  const url = postUrl(post);
  const head = headTags({
    title: postTitle(post),
    description: postDescription(post),
    url,
    image: postImage(post),
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

  // Conteúdo vem do editor do próprio admin, já limpo pela API ao salvar (SEC-01).
  // Vai visível dentro do #root (não em <noscript>: extratores como o Readability,
  // base de muitos leitores de IA, descartam <noscript>). O React troca tudo no
  // primeiro render; ver postArticleHtml. Os dados vão num bloco JSON, não em
  // script inline (a CSP não libera, SEC-02).
  const root = postArticleHtml(post, { related, episodes, categoryLabel, seasonTitle, features, cluster });
  const body = jsonBlock("prerendered-post", post);

  return { head, body, root };
}

// home: { posts, pinned }; preload só sem filtro, quando a vitrine aparece
function homePage(home, withPreload, faq) {
  const posts = [...home.pinned, ...home.posts];
  const head = headTags({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: blogHomeSchema(posts, faq.blog),
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
      ${faqHtml(faq.blog)}
    </noscript>`;

  return { head, body };
}

function seasonsIndexPage(seasons, faq = resolveSiteFaq()) {
  const head = headTags({
    title: `Seasons | ${AUTHOR_NAME}`,
    description: SEASONS_DESCRIPTION,
    url: `${SITE_URL}/seasons`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: seasonsIndexSchema(seasons, faq.seasons),
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
      ${faqHtml(faq.seasons)}
    </noscript>`;

  return { head, body };
}

// Política de Privacidade: texto completo para quem não roda JS (é ela que
// responde "o blog coleta meus dados?"); continua noindex, fora das buscas.
export function privacyPage() {
  const head = headTags({
    title: PRIVACY_TITLE,
    description: PRIVACY_DESCRIPTION,
    url: `${SITE_URL}/privacidade`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: "noindex",
  });

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / Política de Privacidade</p>
      <h1>Política de Privacidade</h1>
      <p>Última atualização: ${esc(PRIVACY_UPDATED)}</p>
      ${PRIVACY_HTML}
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

// Sobre o autor: quem escreve e onde atua, para buscadores e IAs (E-E-A-T)
export function aboutPage() {
  const head = headTags({
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    url: ABOUT_URL,
    image: DEFAULT_IMAGE,
    type: "profile",
    robots: ROBOTS_INDEX,
    schema: aboutSchema(),
  });

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / Sobre</p>
      <h1>Sobre o autor</h1>
      <p>${esc(ABOUT_DESCRIPTION)}</p>
      ${ABOUT_HTML}
    </noscript>`;

  return { head, body };
}

// Pré-diagnóstico gratuito: texto e FAQ para quem não roda JS
export function preDiagnosticoPage() {
  const head = headTags({
    title: PRE_TITLE,
    description: PRE_DESCRIPTION,
    url: PRE_URL,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: preDiagnosticoSchema(),
  });

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / Pré-diagnóstico</p>
      <h1>${esc(PRE_H1)}</h1>
      <p>${esc(PRE_DESCRIPTION)}</p>
      <h2>O que eu verifico</h2>
      <ul>${PRE_CHECKS.map((c) => `<li><strong>${esc(c.title)}:</strong> ${esc(c.text)}</li>`).join("")}</ul>
      <h2>Como funciona</h2>
      <ol>${PRE_STEPS.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <h2>O que isto não é</h2>
      <ul>${PRE_NOT.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <p>${esc(PRE_NOT_NOTE)}</p>
      ${faqHtml(PRE_FAQ)}
    </noscript>`;

  return { head, body };
}

// Tema (cluster): o artigo principal e os relacionados, em links para quem não roda JS
export function clusterPage({ cluster, pillar, posts = [] }) {
  const head = headTags({
    title: clusterTitle(cluster),
    description: cluster.description,
    url: clusterUrl(cluster),
    image: (pillar || posts[0])?.coverImage || DEFAULT_IMAGE,
    type: "website",
    robots: ROBOTS_INDEX,
    schema: clusterSchema(cluster, pillar, posts),
  });

  const item = (p) =>
    `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a>${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}</li>`;
  const pillarHtml = pillar
    ? `<h2>Comece por aqui</h2>
      <p><a href="/blog/${esc(pillar.slug)}">${esc(pillar.title)}</a></p>
      ${pillar.directAnswer || pillar.excerpt ? `<p>${esc(pillar.directAnswer || pillar.excerpt)}</p>` : ""}`
    : cluster.season
      ? `<h2>Comece pela série</h2>
      <p><a href="/seasons/${esc(cluster.season)}">Ver a série completa deste tema</a></p>`
      : "";
  const listHtml = posts.length
    ? `<h2>${pillar ? "Para aprofundar" : "Artigos do tema"}</h2>
      <ul>
          ${posts.map(item).join("\n          ")}
      </ul>`
    : "";

  const services = servicesForCluster(cluster.slug);
  const servicesHtml = services.length
    ? `<h2>${esc(SERVICES_TITLE)}</h2>
      <p>${esc(SERVICES_INTRO)}</p>
      <ul>
          ${services.map((s) => `<li><a href="${esc(s.url)}">${esc(s.name)}</a></li>`).join("\n          ")}
      </ul>`
    : "";

  const body = `<noscript>
      <p><a href="/blog">Blog</a> / ${esc(cluster.title)}</p>
      <h1>${esc(cluster.title)}</h1>
      <p>${esc(cluster.description)}</p>
      ${pillarHtml}
      ${listHtml}
      ${servicesHtml}
    </noscript>`;

  return { head, body };
}

const NOT_FOUND_TITLE = { blog: "Post não encontrado", seasons: "Season não encontrada", temas: "Tema não encontrado" };

// path: "blog" (post), "seasons" ou "temas"
function notFoundPage(slug, path = "blog") {
  const head = headTags({
    title: `${NOT_FOUND_TITLE[path] || NOT_FOUND_TITLE.blog} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/${path}/${encodeURIComponent(slug)}`,
    image: DEFAULT_IMAGE,
    type: "website",
    robots: "noindex",
  });
  // Avisa o React que o post não existe — evita refazer a busca (e um 404 a mais no console)
  const body = path === "blog" ? jsonBlock("prerendered-not-found", slug) : "";
  return { head, body };
}

// Parâmetros que a reescrita do vercel.json usa para escolher a página (não são do visitante)
const ROUTING_PARAMS = ["slug", "season", "cluster", "page"];

/**
 * Endereço antigo de um post (R-POST-17 no backend): a API devolve o post com o
 * slug atual. Devolve o caminho para o 301 (mantém UTMs e outros parâmetros do
 * visitante) ou null se o endereço pedido já é o atual.
 */
export function postRedirectPath(requestedSlug, post, query = {}) {
  if (!post?.slug || post.slug === requestedSlug) return null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!ROUTING_PARAMS.includes(key)) params.append(key, String(value));
  }
  const search = params.toString();
  return `/blog/${encodeURIComponent(post.slug)}${search ? `?${search}` : ""}`;
}

// 200 do bot: cacheável no CDN (evita cold start de ~11 s a cada deploy/expiração)
export const PRERENDER_CACHE_OK = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export default async function handler(req, res) {
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const seasonSlug = typeof req.query.season === "string" ? req.query.season : "";
  const isSeasons = req.query.page === "seasons";
  const isPrivacy = req.query.page === "privacidade";
  const isAbout = req.query.page === "sobre";
  const isPre = req.query.page === "pre-diagnostico";
  const clusterSlug = typeof req.query.cluster === "string" ? req.query.cluster : "";

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
  // Diagnóstico: "local" = shell do próprio deploy; "fetch" = buscado pelo domínio
  res.setHeader("X-Prerender-Shell", shell.source || "fetch");

  try {
    let page;
    let status = 200;
    // Em paralelo com a busca principal de cada rota
    const shared = sharedData();
    const data = {};

    if (isPrivacy) {
      page = privacyPage();
    } else if (isAbout) {
      page = aboutPage();
    } else if (isPre) {
      page = preDiagnosticoPage();
    } else if (clusterSlug) {
      const data = await fetchJson(`${API_URL}/clusters/${encodeURIComponent(clusterSlug)}`);
      if (data) {
        page = clusterPage(data);
      } else {
        page = notFoundPage(clusterSlug, "temas");
        status = 404;
      }
    } else if (seasonSlug) {
      const data = await fetchJson(`${API_URL}/seasons/${encodeURIComponent(seasonSlug)}`);
      if (data) {
        page = seasonPage(data);
      } else {
        page = notFoundPage(seasonSlug, "seasons");
        status = 404;
      }
    } else if (isSeasons) {
      const [list, faq] = await Promise.all([fetchJson(`${API_URL}/seasons`), fetchSiteFaq()]);
      if (faq) data.siteFaq = faq;
      page = seasonsIndexPage(list || [], faq || undefined);
    } else if (slug) {
      const post = await fetchJson(`${API_URL}/posts/slug/${encodeURIComponent(slug)}`);
      const redirectTo = postRedirectPath(slug, post, req.query);
      if (redirectTo) {
        // 301: o Google transfere o endereço antigo para o novo; a CDN guarda 10 min
        res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
        res.setHeader("Location", redirectTo);
        return res.status(301).end();
      }
      if (post) {
        // Selo da season no topo do post (SeasonNav) e "Continue lendo": entram no
        // HTML como links e vão prontos para o React (sem buscar de novo)
        const [episodes, related, settings, cluster] = await Promise.all([
          post.season ? fetchOptional(`${API_URL}/posts/season/${encodeURIComponent(post.season)}`) : null,
          fetchOptional(`${API_URL}/posts/public/${encodeURIComponent(post._id)}/related`),
          fetchOptional(`${API_URL}/settings/features`),
          post.cluster ? fetchOptional(`${API_URL}/clusters/${encodeURIComponent(post.cluster)}`) : null,
        ]);
        if (episodes) data.seasonEpisodes = episodes;
        if (cluster) data.clusterPosts = cluster;
        if (Array.isArray(related)) data.related = { postId: post._id, posts: related };
        const { categories = [], seasons = [] } = await shared;
        page = postPage(post, {
          related: Array.isArray(related) ? related : [],
          episodes,
          categoryLabel: categories.find((c) => c.slug === post.category)?.label,
          seasonTitle: seasons.find((s) => s.slug === post.season)?.title || episodes?.season?.title,
          features: settings?.features,
          cluster,
        });
      } else {
        page = notFoundPage(slug);
        status = 404;
      }
    } else {
      // limit 48 = maior opção de "itens por página" da BlogHome: serve qualquer escolha
      const [list, pinned, highlights, faq] = await Promise.all([
        fetchJson(`${API_URL}/posts/published?page=1&limit=48&excludePinned=1&fields=card`),
        fetchOptional(`${API_URL}/posts/pinned`),
        fetchOptional(`${API_URL}/posts/highlights`),
        fetchSiteFaq(),
      ]);
      // Lista e vitrine só valem para /blog sem filtro (com ?categoria=, ?q=… a
      // BlogHome busca no navegador). Sem fixados/destaques (falha da API), idem.
      const defaultView = !["categoria", "q", "pagina", "ordem"].some((key) => key in req.query);
      // Card não usa o conteúdo; garante isso mesmo com uma API que ignore fields=card
      const posts = (list?.posts || []).map(({ content, ...card }) => card); // eslint-disable-line no-unused-vars
      if (defaultView && Array.isArray(pinned) && Array.isArray(highlights)) {
        data.home = { posts, total: list?.total || 0, pinned, highlights };
      }
      if (faq) data.siteFaq = faq;
      page = homePage({ posts, pinned: pinned || [] }, defaultView, faq || resolveSiteFaq());
    }

    Object.assign(data, await shared);
    page.body += `\n    ${dataScript(data)}`;

    res.setHeader(
      "Cache-Control",
      !shell.fresh
        ? "no-store"
        : status === 200
        ? PRERENDER_CACHE_OK
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
