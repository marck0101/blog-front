// Página /sobre: uma fonte só para o React (src/pages/Blog/About.jsx) e para o
// api/prerender.js. É a página que prova quem escreve o blog (E-E-A-T) e onde
// o autor atua (SEO regional). HTML estático e confiável, escrito aqui.
//
// Regra 4 do BRAND.md: número só com fonte e período. Os resultados de clientes
// citados no post "De dev a gestor de tráfego" (receita, ROAS) entram aqui
// quando tiverem período e base confirmados.

import { AUTHOR_NAME, PERSON, PORTFOLIO_URL, SITE_URL, WEBSITE_ID } from "./site.js";

export const ABOUT_TITLE = `Sobre ${AUTHOR_NAME} | Gestor de tráfego e desenvolvedor no RS`;
export const ABOUT_DESCRIPTION =
  "Gestor de tráfego e desenvolvedor full stack no noroeste do RS. Tráfego pago, tracking, dashboards e SEO para negócios locais e agências.";
export const ABOUT_REGION = "noroeste do Rio Grande do Sul";

export const ABOUT_HTML = `
  <section>
    <h2>Quem escreve</h2>
    <p>Sou ${AUTHOR_NAME}, gestor de tráfego e desenvolvedor full stack. Atuo a partir do ${ABOUT_REGION} e atendo empresas de todo o Brasil. Comecei como desenvolvedor na V4 Company, passei a cuidar do rastreamento e das métricas das contas e virei gestor de tráfego sem parar de programar. Hoje estou na GH Branding.</p>
  </section>
  <section>
    <h2>O que eu faço</h2>
    <ul>
      <li><strong>Tráfego pago:</strong> Google Ads e Meta Ads com meta e custo por venda acompanhados, não só cliques.</li>
      <li><strong>Rastreamento:</strong> GA4, Google Tag Manager, API de Conversões e Data Layer configurados antes do primeiro real em mídia.</li>
      <li><strong>Dashboards e BI:</strong> painéis que mostram se a empresa está perto ou longe da meta, com login e dados protegidos.</li>
      <li><strong>Site e SEO:</strong> site rápido, seguro e encontrável no Google e nas IAs, como este blog.</li>
    </ul>
  </section>
  <section>
    <h2>Para quem</h2>
    <p>Negócios locais que já investem em tráfego e conteúdo, mas não sabem o que realmente traz venda, com foco inicial no noroeste do RS. E agências e times que precisam de tracking, dashboards e automação sem montar uma equipe de desenvolvimento.</p>
  </section>
  <section>
    <h2>Como eu trabalho</h2>
    <ol>
      <li><strong>Medir antes de escalar:</strong> rastreamento configurado antes de aumentar o investimento.</li>
      <li><strong>O básico bem feito:</strong> site rápido, pixel certo, campanha bem estruturada.</li>
      <li><strong>Engenharia no marketing:</strong> automação, dashboards e comparativos feitos com código.</li>
      <li><strong>Números na mesa:</strong> mostro o que funcionou e o que não funcionou, sempre com a fonte.</li>
    </ol>
  </section>
  <section>
    <h2>Onde me encontrar</h2>
    <p>Portfólio: <a href="${PORTFOLIO_URL}">marck0101.com.br</a> · LinkedIn: <a href="https://www.linkedin.com/in/marcos-henrique-corr%C3%AAa-618392209/" rel="me">Marcos Henrique Corrêa</a> · GitHub: <a href="https://github.com/marck0101" rel="me">marck0101</a></p>
  </section>
`;

export const ABOUT_URL = `${SITE_URL}/sobre`;

// ProfilePage + Person completo: o que faz, onde atua (mesmo @id do portfólio)
export function aboutSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${ABOUT_URL}#page`,
        url: ABOUT_URL,
        name: ABOUT_TITLE,
        description: ABOUT_DESCRIPTION,
        inLanguage: "pt-BR",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON["@id"] },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 2, name: "Sobre", item: ABOUT_URL },
        ],
      },
      PERSON,
    ],
  };
}
