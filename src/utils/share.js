import { SITE_URL } from "../seo/site";
import PostsService from "../services/posts.service";
import { trackEvent } from "./analytics";

// Canais aceitos pela API (mesma lista de postStats.service.js)
export const SHARE_CHANNELS = {
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  telegram: "Telegram",
  email: "Email",
  copy: "Link copiado",
  native: "Menu do celular",
};

/**
 * Link do post com UTM de compartilhamento: utm_source=<canal>,
 * utm_medium=share, utm_campaign=post-<slug>. Quem chegar por ele conta como
 * "visita por compartilhamento" (no painel e no GA4). O canonical da página
 * continua sem UTM.
 */
export function shareUrl(slug, channel) {
  const params = new URLSearchParams({
    utm_source: channel,
    utm_medium: "share",
    utm_campaign: `post-${slug}`,
  });
  return `${SITE_URL}/blog/${slug}?${params}`;
}

// URL da rede para abrir em nova aba (null = canal sem página própria)
export function networkUrl(channel, { url, title }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "x":
      return `https://x.com/intent/post?text=${t}&url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "email":
      return `mailto:?subject=${t}&body=${encodeURIComponent(`Achei que você ia gostar deste artigo:\n\n${title}\n${url}`)}`;
    default:
      return null;
  }
}

// Conta o compartilhamento (API, anônimo) e manda o evento "share" do GA4
export function recordShare(post, channel, location = "post") {
  PostsService.engage(post._id || post.id, "share", channel);
  trackEvent("share", {
    method: channel,
    content_type: "article",
    item_id: post.slug,
    post_category: post.category,
    link_location: location,
  });
}

/**
 * Chegou por um link compartilhado (utm_medium=share)? Conta uma vez por
 * sessão e por post.
 */
export function recordShareVisit(post) {
  const params = new URLSearchParams(window.location.search);
  const channel = (params.get("utm_source") || "").toLowerCase();
  if (params.get("utm_medium") !== "share" || !SHARE_CHANNELS[channel]) return;

  const key = `share-visit:${post.slug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, channel);
  } catch {
    /* sem sessionStorage: conta mesmo assim */
  }
  PostsService.engage(post._id || post.id, "share_visit", channel);
}
