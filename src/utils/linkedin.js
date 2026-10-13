import slugify from "slugify";
import { SITE_URL } from "../seo/site";

// Campos do post do LinkedIn editáveis no painel
export const emptyLinkedIn = () => ({ enabled: false, text: "", imageUrl: "", comment: "" });

// Comentário guardado como modelo: {link} vira a URL do artigo na publicação,
// então trocar o slug depois não deixa o link velho no comentário
export const LINK_TOKEN = "{link}";
export const DEFAULT_COMMENT = `Artigo completo no blog: ${LINK_TOKEN}`;

// Mesmo slug que o servidor gera a partir do título (slugify, lower, strict)
export const slugFromTitle = (title) => slugify(title || "", { lower: true, strict: true });

// Mesma URL que o servidor comenta (app/services/linkedin.service.js).
// O canonical do artigo é sem UTM, então não cria URL duplicada no Google.
export function linkedinArticleUrl(slug) {
  const u = new URL(`${SITE_URL}/blog/${slug}`);
  u.searchParams.set("utm_source", "linkedin");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", `post-${slug}`.slice(0, 80));
  u.searchParams.set("utm_content", "comentario");
  return u.toString();
}
