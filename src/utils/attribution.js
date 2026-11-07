// Origem da visita (primeira página da sessão): vai junto na inscrição da
// newsletter para saber de onde vêm os assinantes. Fica só na sessão do
// navegador e só sai daqui se a pessoa enviar o formulário.
const KEY = "landing-attribution";

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

/** Chamar a cada navegação; grava só na primeira página da sessão */
export function captureAttribution() {
  if (read()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    let referrer = "";
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host !== window.location.hostname) referrer = host;
    }
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        landingPath: window.location.pathname,
        referrer,
        utmSource: params.get("utm_source") || "",
        utmMedium: params.get("utm_medium") || "",
        utmCampaign: params.get("utm_campaign") || "",
      })
    );
  } catch {
    /* sem sessionStorage: segue sem origem */
  }
}

export function getAttribution() {
  return read() || {};
}

// Assistentes de IA que mandam visitas: pelo referrer ou pelo utm_source que
// eles mesmos colocam no link (ex.: ChatGPT usa utm_source=chatgpt.com)
const AI_SOURCES = [
  ["chatgpt", /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/],
  ["perplexity", /(^|\.)perplexity\.ai$/],
  ["claude", /(^|\.)claude\.ai$/],
  ["gemini", /(^|\.)(gemini\.google\.com|bard\.google\.com)$/],
  ["copilot", /(^|\.)(copilot\.microsoft\.com|copilot\.cloud\.microsoft)$/],
  ["deepseek", /(^|\.)(chat\.)?deepseek\.com$/],
  ["meta_ai", /(^|\.)meta\.ai$/],
  ["grok", /(^|\.)grok\.com$/],
];

/** Nome do assistente de IA de onde veio a sessão, ou "" */
export function aiSource({ referrer = "", utmSource = "" } = getAttribution()) {
  const candidates = [referrer, utmSource].map((v) => String(v).toLowerCase().trim()).filter(Boolean);
  for (const [name, pattern] of AI_SOURCES) {
    if (candidates.some((c) => pattern.test(c))) return name;
  }
  return "";
}
