import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Endereço que não existe precisa dar 404 de verdade (crawlers e Google leem o
// status, não a tela). Só as rotas reais do app vão para o index.html; o resto
// cai no public/404.html. Página nova no router = linha nova no vercel.json.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const router = readFileSync(join(root, "src/routes/index.jsx"), "utf8");

const routerPaths = [...router.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*" && p !== "/");

// Mesmo formato de caminho do vercel.json (":slug", ":path*") virando regex
const toRegex = (source) =>
  new RegExp(`^${source.replace(/:\w+\*/g, ".+").replace(/:\w+/g, "[^/]+")}$`);

const sources = [...vercel.rewrites, ...vercel.redirects].map((r) => toRegex(r.source));
const served = (path) => sources.some((re) => re.test(path.replace(/:\w+/g, "x")));

describe("vercel.json: 404 real para endereço inexistente", () => {
  it("toda rota do app tem reescrita (senão a página nova dá 404 em produção)", () => {
    const missing = routerPaths.filter((path) => !served(path));
    expect(missing).toEqual([]);
  });

  it("sem reescrita genérica para o index.html", () => {
    const catchAll = vercel.rewrites.filter((r) => r.destination === "/index.html" && /\(|\.\*|\*\)/.test(r.source));
    expect(catchAll).toEqual([]);
  });

  it.each(["/academy", "/precos", "/sobre", "/contato", "/blog/a/b"])("%s não é servido", (path) => {
    expect(served(path)).toBe(false);
  });
});
