import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Páginas pessoais/sem conteúdo próprio ficam fora das buscas também para robô
// que não roda JavaScript: o <SEO robots="noindex"> só aparece depois do React.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));

// Regex no mesmo formato que o Vercel aplica ao "source" (path-to-regexp simples)
function robotsFor(path) {
  return vercel.headers
    .filter((h) => new RegExp(`^${h.source}$`).test(path))
    .flatMap((h) => h.headers)
    .filter((h) => h.key === "X-Robots-Tag")
    .map((h) => h.value);
}

describe("vercel.json: X-Robots-Tag", () => {
  it.each(["/favoritos", "/privacidade", "/cancelar-inscricao", "/admin", "/admin/posts"])(
    "%s sai com noindex",
    (path) => {
      expect(robotsFor(path).join(",")).toContain("noindex");
    }
  );

  it.each(["/blog", "/blog/um-post", "/seasons", "/sugestoes"])("%s continua indexável", (path) => {
    expect(robotsFor(path)).toEqual([]);
  });
});
