// Microsoft Clarity (mapas de calor e gravações de sessão) — só no blog público
// do domínio de produção, e só se o visitante não recusou cookies analíticos.
const CLARITY_ID = "yv1fb9k675";
const PROD_HOSTS = ["blog.marck0101.com.br"];

export const CONSENT_EVENT = "cookie-consent";

let loaded = false;
let running = false;

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

function load() {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
  loaded = true;
  running = true;
}

/** Liga/desliga o Clarity conforme a rota atual e o consentimento. */
export function syncClarity(pathname) {
  if (!isProdHost()) return;

  // Admin mostra emails de assinantes: nunca gravar
  const shouldRun = !pathname.startsWith("/admin") && analyticsAllowed();

  if (shouldRun && !loaded) return load();
  if (shouldRun && !running) {
    window.clarity("start");
    running = true;
  } else if (!shouldRun && running) {
    window.clarity("stop");
    running = false;
  }
}
