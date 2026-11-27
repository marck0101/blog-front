// Origem do pedido de pré-diagnóstico (R4): de qual página do blog a pessoa veio.
// Só caminho de página (slug), nunca query string, e-mail, nome ou qualquer dado de pessoa.
const SLUG_MAX = 60;
const REF_MAX = 70;

/** "/blog/meu-post?utm=x#a" -> "/blog/meu-post"; "/blog" -> "/blog"; qualquer outra coisa -> "" */
export function originPath(raw) {
  const path = String(raw ?? "").split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "");
  if (path === "/blog") return "/blog";
  const m = path.match(/^\/blog\/([a-z0-9-]+)$/);
  return m && m[1].length <= SLUG_MAX ? path : "";
}

/** Caminho de origem -> texto curto da mensagem: "/blog/meu-post" -> "blog-meu-post"; home do blog -> "blog-home" */
export function originRef(raw) {
  const path = originPath(raw);
  if (!path) return "";
  return path === "/blog" ? "blog-home" : `blog-${path.slice("/blog/".length)}`;
}

/** Limpa o que a pessoa digita no campo da referência: minúsculas, letras, números e hífen, até 70 caracteres */
export function cleanRef(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, REF_MAX);
}

/** Linha final da mensagem ("[ref: blog-meu-post]"); vazio quando não há referência */
export function refLine(ref) {
  const clean = cleanRef(ref).replace(/^-+|-+$/g, "");
  return clean ? `[ref: ${clean}]` : "";
}

/** Link para o pré-diagnóstico levando a origem (só quando for uma página válida do blog) */
export function preDiagnosticoLink(fromPath) {
  const path = originPath(fromPath);
  return path ? `/pre-diagnostico?de=${path}` : "/pre-diagnostico";
}
