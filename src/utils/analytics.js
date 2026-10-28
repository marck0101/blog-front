// Ferramentas de análise do blog público: Microsoft Clarity (mapas de calor e
// gravações), Google Analytics 4 e Meta Pixel. Só rodam no domínio de produção, fora do
// /admin e se o visitante não recusou cookies analíticos.
const CLARITY_ID = "yv1fb9k675";
const GA_ID = "G-YMX46P4H2P";
const PIXEL_ID = "1042435387262327";
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

// Navegador do autor não entra nas métricas (filtro por IP não pega celular nem
// rede móvel): marcado ao entrar no painel (indicador "user" do AuthContext) ou
// abrindo qualquer página com ?notrack=1 — útil no celular. ?notrack=0 desfaz.
const OPTOUT_KEY = "analytics-optout";

const isAuthorBrowser = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("notrack");
    if (param === "1" || localStorage.getItem("user")) localStorage.setItem(OPTOUT_KEY, "1");
    else if (param === "0") localStorage.removeItem(OPTOUT_KEY);
    return localStorage.getItem(OPTOUT_KEY) === "1";
  } catch {
    return false;
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

/* ================= META PIXEL ================= */

let pixelLoaded = false;
let lastPixelPath = null;

function loadPixel() {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  // PageView manual a cada rota (abaixo): o rastreio automático de histórico
  // do pixel dispararia antes de sabermos que a rota nova é do /admin
  window.fbq.disablePushState = true;
  window.fbq("init", PIXEL_ID);
  pixelLoaded = true;
}

function syncPixel(enabled, pathname) {
  if (!enabled) {
    if (pixelLoaded) window.fbq("consent", "revoke");
    lastPixelPath = null; // ao voltar para o blog conta um PageView novo
    return;
  }
  if (!pixelLoaded) loadPixel();
  else window.fbq("consent", "grant");
  // Um PageView por rota (o efeito também roda quando o visitante responde ao banner)
  if (lastPixelPath !== pathname) {
    window.fbq("track", "PageView");
    lastPixelPath = pathname;
  }
}

/* ================= CARREGAMENTO ADIADO ================= */

// GA4 + Pixel + Clarity somam ~400 KB e, baixados junto com a página, disputam a
// rede com a capa do LCP no celular. Só entram na primeira interação ou 3 s
// depois do load, o que vier antes (em rede rápida o load sai antes do próprio
// LCP, então "logo após o load" não bastava). O GA4 manda o page_view ao
// carregar; LCP/CLS do web-vitals vêm de entradas "buffered", então nada se
// perde por começar depois. Custo: visita de menos de ~3 s sem nenhum toque
// não é registrada.
const LOAD_DELAY = 3000;
let pageReady = false;
let pendingPath = null;

function whenPageReady(run) {
  const events = ["pointerdown", "keydown", "scroll", "touchstart"];
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    events.forEach((e) => window.removeEventListener(e, go, true));
    run();
  };
  events.forEach((e) => window.addEventListener(e, go, { capture: true, passive: true, once: true }));
  const later = () => setTimeout(go, LOAD_DELAY);
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

/** Liga/desliga as ferramentas conforme a rota atual e o consentimento. */
export function syncAnalytics(pathname) {
  if (!isProdHost()) return;
  if (!pageReady) {
    if (pendingPath === null) {
      whenPageReady(() => {
        pageReady = true;
        applyAnalytics(pendingPath);
      });
    }
    pendingPath = pathname; // vale a rota em que o visitante estiver ao liberar
    return;
  }
  applyAnalytics(pathname);
}

function applyAnalytics(pathname) {

  // Admin mostra emails de assinantes: nunca medir/gravar
  const enabled = !pathname.startsWith("/admin") && analyticsAllowed() && !isAuthorBrowser();

  syncClarity(enabled);
  syncGA(enabled);
  syncPixel(enabled, pathname);
  if (enabled) startWebVitals();
}

/* ================= EVENTOS ================= */

const gaActive = () => gaLoaded && !window[`ga-disable-${GA_ID}`];

/**
 * Envia um evento para as três ferramentas ativas:
 * - GA4: `name` com `params` (marque os de conversão como "evento-chave" no GA4)
 * - Clarity: `name` como evento, para filtrar gravações e montar funis
 * - Pixel: só se `pixel` for informado (evento padrão da Meta, ex.: "Lead")
 */
export function trackEvent(name, params = {}, { pixel, pixelParams } = {}) {
  if (gaActive()) window.gtag("event", name, params);
  if (clarityRunning) window.clarity("event", name);
  if (pixel && pixelLoaded && lastPixelPath) window.fbq("track", pixel, pixelParams ?? {});
}

// Link de contato (WhatsApp/email) → nome do método para o evento "contact"
export function contactMethod(href = "") {
  if (/^mailto:/i.test(href)) return "email";
  if (/wa\.me|api\.whatsapp\.com/i.test(href)) return "whatsapp";
  return null;
}

/**
 * Contexto da página para segmentar gravações do Clarity
 * (ex.: { page_type: "post", post_category: "trafego" }).
 */
export function setPageContext(tags) {
  if (!clarityRunning) return;
  Object.entries(tags).forEach(([key, value]) => {
    if (value) window.clarity("set", key, String(value));
  });
}

/* ================= CORE WEB VITALS ================= */

let vitalsStarted = false;

// LCP, INP e CLS reais dos visitantes vão para o GA4 (eventos com o nome da
// métrica), complementando o relatório de Core Web Vitals do Search Console
async function startWebVitals() {
  if (vitalsStarted) return;
  vitalsStarted = true;
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");
  const send = ({ name, value, rating, id, navigationType }) => {
    if (!gaActive()) return;
    window.gtag("event", name, {
      value: Math.round(name === "CLS" ? value * 1000 : value),
      metric_value: value,
      metric_rating: rating, // good | needs-improvement | poor
      metric_id: id,
      navigation_type: navigationType,
      non_interaction: true,
    });
  };
  onLCP(send);
  onINP(send);
  onCLS(send);
  onFCP(send);
  onTTFB(send);
}
