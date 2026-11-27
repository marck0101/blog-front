// Página /pre-diagnostico: uma fonte só para o React (src/pages/Blog/PreDiagnostico.jsx)
// e para o api/prerender.js. Texto direto, sem número que não seja real (regra 4 do BRAND.md).

import { AUTHOR_NAME, SITE_URL, WEBSITE_ID, cleanFaq, faqPageSchema } from "./site.js";

export const PRE_PATH = "/pre-diagnostico";
export const PRE_URL = `${SITE_URL}${PRE_PATH}`;
export const PRE_TITLE = "Pré-diagnóstico gratuito de marketing";
export const PRE_DESCRIPTION =
  "Analiso seu site, seu Google Meu Negócio e seu rastreamento, comparo com concorrentes e envio um relatório curto em PDF. Sem custo e sem compromisso.";
export const PRE_H1 = "Seu site e seu Google estão trazendo cliente ou só existindo?";

export const PRE_WHATSAPP_NUMBER = "5555963370494";
export const PRE_EMAIL = "marck.mhc@gmail.com";
export const PRE_MESSAGE = "Olá, Marcos! Quero o pré-diagnóstico gratuito. Site: ___ Cidade: ___";
export const PRE_WHATSAPP_URL = `https://wa.me/${PRE_WHATSAPP_NUMBER}?text=${encodeURIComponent(PRE_MESSAGE)}`;
export const PRE_EMAIL_BODY = "Olá, Marcos!\nQuero o pré-diagnóstico gratuito.\nSite: \nCidade: ";
export const PRE_EMAIL_URL = `mailto:${PRE_EMAIL}?subject=${encodeURIComponent("Pré-diagnóstico gratuito")}&body=${encodeURIComponent(PRE_EMAIL_BODY)}`;

export const PRE_CHECKS = [
  { title: "Google Meu Negócio", text: "Se a ficha está completa, correta e aparece quando alguém da sua cidade procura o que você vende." },
  { title: "Velocidade do site no celular", text: "Quanto tempo a página leva para abrir no celular, onde está a maior parte dos clientes." },
  { title: "SEO e respostas de IA (GEO)", text: "Se o site aparece no Google e se as IAs, como o ChatGPT, conseguem entender e citar o que você faz." },
  { title: "Tags e pixels", text: "Se as conversões (mensagem no WhatsApp, formulário, compra) estão sendo medidas de verdade." },
];

export const PRE_STEPS = [
  "Você me manda o site e a cidade.",
  "Eu rodo a análise e comparo com até 3 concorrentes.",
  "Você recebe um relatório curto em PDF e, se fizer sentido, conversamos 20 minutos.",
];

export const PRE_NOT = [
  "Sem custo.",
  "Sem compromisso.",
  "Sem pacote fechado.",
];
export const PRE_NOT_NOTE = "Eu só proponho algo se o relatório mostrar um problema real.";

export const PRE_FAQ = [
  {
    question: "Quanto custa o pré-diagnóstico?",
    answer: "Nada. É gratuito e não exige compromisso. Se o relatório mostrar um problema real, eu explico o que faria; contratar é decisão sua.",
  },
  {
    question: "Preciso dar acesso às minhas contas?",
    answer: "Não. A análise usa só o que é público: o site, a ficha do Google e o que aparece nas buscas. Se eu precisar olhar algo interno, eu peço antes e você decide.",
  },
  {
    question: "Para quem é?",
    answer: "Para donos de negócios locais e agências, principalmente do noroeste do Rio Grande do Sul. Atendo empresas de todo o Brasil.",
  },
];

export function preDiagnosticoSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PRE_URL}#page`,
        url: PRE_URL,
        name: PRE_TITLE,
        description: PRE_DESCRIPTION,
        inLanguage: "pt-BR",
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@type": "Person", name: AUTHOR_NAME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 2, name: "Pré-diagnóstico", item: PRE_URL },
        ],
      },
      faqPageSchema(cleanFaq(PRE_FAQ), `${PRE_URL}#faq`),
    ],
  };
}
