// Texto do erro que a API devolveu ({ error: "..." }, DUP-01) ou "" se não houver.
// Uso: errorText(err) || "Mensagem padrão da tela"
// `message`: formato antigo das rotas de login, enquanto a API anterior pode estar no ar.
export function errorText(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== "object") return "";
  const text = data.error || data.message;
  return typeof text === "string" ? text : "";
}
