// Mapa tema -> páginas de serviço (pilares em servicos.marck0101.com.br).
// Os temas vêm do backend; o mapa fica aqui, por slug. Igual no React e no
// api/prerender.js (R8.2).
export const SERVICES_URL = "https://servicos.marck0101.com.br";

export const SERVICES = {
  trafego: "Anúncios no Google e no Instagram (tráfego pago)",
  tagueamento: "Medir de onde vêm os clientes (tagueamento)",
  performance: "Site rápido no celular",
  "seo-geo": "Ser encontrado no Google e no ChatGPT (SEO/GEO)",
  gmb: "Perfil no Google Maps que atrai clientes",
  dashboard: "Painel único com os números do negócio",
  "follow-up": "Rotina de retorno e fidelização",
  reativacao: "Trazer de volta clientes inativos",
  catalogo: "Catálogo online para mandar no WhatsApp",
};

export const CLUSTER_SERVICES = {
  "trafego-pago-medido": ["trafego", "tagueamento"],
  "site-rapido-e-encontravel": ["performance", "seo-geo", "gmb"],
  "dashboards-e-bi": ["dashboard"],
  "engenharia-no-marketing": ["follow-up", "reativacao", "catalogo"],
  "seguranca-na-diretoria": [],
};

export const SERVICES_TITLE = "Quer que eu faça isso por você?";
export const SERVICES_INTRO = "Se preferir, eu cuido disso para o seu negócio. Veja como funciona cada serviço para negócios locais:";

export const serviceUrl = (slug) => `${SERVICES_URL}/servicos/${slug}`;

// [{ slug, name, url }] — vazio se o tema não tem serviços mapeados
export function servicesForCluster(clusterSlug) {
  return (Object.hasOwn(CLUSTER_SERVICES, clusterSlug) ? CLUSTER_SERVICES[clusterSlug] : [])
    .map((slug) => ({ slug, name: SERVICES[slug], url: serviceUrl(slug) }));
}
