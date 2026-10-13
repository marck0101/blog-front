// Taxa (0–1) em porcentagem pt-BR; null = sem dado (ex.: envio sem rastreio)
export function formatRate(rate, digits = 1) {
  if (rate === null || rate === undefined) return "—";
  return `${(rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;
}

// URL de link de email legível: domínio + caminho, sem UTM
export function shortUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}
