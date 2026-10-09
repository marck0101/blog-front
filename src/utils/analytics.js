// Ferramentas de análise do blog público: Microsoft Clarity (mapas de calor e
// gravações) e Google Analytics 4. Só rodam no domínio de produção, fora do
// /admin e se o visitante não recusou cookies analíticos.
const CLARITY_ID = "yv1fb9k675";
const GA_ID = "G-YMX46P4H2P";
const PROD_HOSTS = ["blog.marck0101.com.br"];

export const CONSENT_EVENT = "cookie-consent";

const isProdHost = () => PROD_HOSTS.includes(window.location.hostname);

// "essential" = recusou analíticos | "all" ou sem resposta = permitido
// (o banner informa que continuar navegando é aceitar)
const analyticsAllowed = () => {
  try {
    return localStorage.getItem("cookiesAccepted") !== "essential";
  } catch {
    return true;
  }
};

/* ================= CLARITY ================= */

let clarityLoaded = false;
let clarityRunning = false;

function loadClarity() {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
  clarityLoaded = true;
  clarityRunning = true;
}

function syncClarity(enabled) {
  if (enabled && !clarityLoaded) return loadClarity();
  if (enabled && !clarityRunning) {
    window.clarity("start");
    clarityRunning = true;
  } else if (!enabled && clarityRunning) {
    window.clarity("stop");
    clarityRunning = false;
  }
}

/* ================= GOOGLE ANALYTICS 4 ================= */

let gaLoaded = false;

function loadGA() {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // page_view da primeira página; as navegações seguintes do React Router são
  // contadas pela medição otimizada do GA4 (mudanças no histórico do navegador)
  window.gtag("config", GA_ID);
  gaLoaded = true;
}

function syncGA(enabled) {
  // Flag oficial de opt-out do gtag: checada a cada evento, então desligar
  // ao entrar no /admin (ou ao recusar cookies) impede o envio dali em diante
  window[`ga-disable-${GA_ID}`] = !enabled;
  if (enabled && !gaLoaded) loadGA();
}

/** Liga/desliga as ferramentas conforme a rota atual e o consentimento. */
export function syncAnalytics(pathname) {
  if (!isProdHost()) return;

  // Admin mostra emails de assinantes: nunca medir/gravar
  const enabled = !pathname.startsWith("/admin") && analyticsAllowed();

  syncClarity(enabled);
  syncGA(enabled);
}
