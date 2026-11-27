import { trackEvent } from "./analytics";

// UTMs da visita (utm_source etc.) seguem nos eventos para ligar o pedido à origem
export function utmParams(search = typeof window !== "undefined" ? window.location.search : "") {
  const out = {};
  new URLSearchParams(search).forEach((value, key) => {
    if (/^utm_[a-z_]+$/i.test(key) && value) out[key.toLowerCase()] = value.slice(0, 100);
  });
  return out;
}

// Clique no CTA do pré-diagnóstico: evento próprio + conversão "contact" (Pixel Contact),
// o mesmo padrão do rodapé
export function trackPreDiagnosticoCta(method, linkLocation, origin = "") {
  const params = { method, link_location: linkLocation, ...(origin ? { origin_path: origin } : {}), ...utmParams() };
  trackEvent("pre_diagnostico_cta", params);
  trackEvent("contact", params, { pixel: "Contact" });
}
