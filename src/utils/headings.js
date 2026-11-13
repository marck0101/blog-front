// Âncoras dos intertítulos do post (h2 e h3): cada um ganha um id a partir do
// próprio texto ("Quanto custa?" -> "quanto-custa"), o mesmo no prerender
// (api/prerender.js) e no React, para o link /blog/post#secao abrir no lugar
// certo. Sem DOM: roda também no servidor.

const HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const ID_ATTR = /\sid=(["'])([^"']*)\1/i;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function headingText(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text) {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || "secao";
}

// Devolve o HTML com os ids e a lista dos intertítulos ({ id, text, level }).
// Id que o texto já trazia é mantido; repetidos ganham -2, -3...
export function withHeadingIds(html) {
  const headings = [];
  if (!html) return { html: html || "", headings };
  const used = new Set();

  const out = html.replace(HEADING, (match, level, attrs = "", inner) => {
    const text = headingText(inner);
    if (!text) return match;
    const existing = attrs.match(ID_ATTR)?.[2];
    let id = existing || slugifyHeading(text);
    if (!existing) {
      const base = id;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    }
    used.add(id);
    headings.push({ id, text, level: Number(level) });
    return existing ? match : `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });

  return { html: out, headings };
}

// Itens do sumário: só os h2, e só a partir de 3 seções (post curto não precisa)
export const TOC_MIN_SECTIONS = 3;

export function tocItems(headings) {
  const items = headings.filter((h) => h.level === 2);
  return items.length >= TOC_MIN_SECTIONS ? items : [];
}

// Quanto do texto já foi lido (0 a 1), para a barra do topo: começa quando o
// topo do texto chega ao topo da tela e enche quando o fim dele aparece embaixo.
export function readingProgress(rect, viewportHeight) {
  const total = rect.height - viewportHeight;
  if (total <= 0) return rect.bottom <= viewportHeight ? 1 : 0;
  return Math.min(1, Math.max(0, -rect.top / total));
}

// Id da âncora do endereço (#secao). Âncora malformada (#%E0) é erro no
// decodeURIComponent e derrubava a página do post inteira: vira "sem âncora".
export function hashId(hash) {
  try {
    return decodeURIComponent(String(hash || "").slice(1));
  } catch {
    return "";
  }
}
