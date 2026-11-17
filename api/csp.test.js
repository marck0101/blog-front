import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CSP do site e do painel valendo desde a SEC-02 (vercel.json). Este teste trava
// o que não pode voltar: modo só-relatório, script inline e o envio dos relatórios.
// Ferramenta nova de terceiro = domínio novo na política (R-CSP-02 no SISTEMA.md da API).
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const all = vercel.headers.find((h) => h.source === "/(.*)").headers;

const policies = all.filter((h) => h.key.startsWith("Content-Security-Policy"));
const directives = Object.fromEntries(
  (policies[0]?.value || "")
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .filter((d) => d[0])
    .map(([name, ...values]) => [name, values])
);

describe("vercel.json: Content-Security-Policy", () => {
  it("uma política só, valendo (não em modo só-relatório)", () => {
    expect(policies.map((h) => h.key)).toEqual(["Content-Security-Policy"]);
  });

  it("script sem 'unsafe-inline' nem 'unsafe-eval'", () => {
    expect(directives["script-src"]).toBeDefined();
    expect(directives["script-src"]).not.toContain("'unsafe-inline'");
    expect(directives["script-src"]).not.toContain("'unsafe-eval'");
    expect(directives["default-src"]).toEqual(["'self'"]);
  });

  it("mantém as travas que vinham da política mínima", () => {
    expect(directives["frame-ancestors"]).toEqual(["'none'"]);
    expect(directives["object-src"]).toEqual(["'none'"]);
    expect(directives["base-uri"]).toEqual(["'self'"]);
  });

  it("continua mandando os relatórios para a API", () => {
    expect(directives["report-uri"]).toEqual(["https://api.blog.marck0101.com.br/api/csp-report"]);
  });

  it("libera a API e as análises (GA4 manda parte das batidas para www.google.com)", () => {
    const connect = directives["connect-src"];
    for (const origin of [
      "https://api.blog.marck0101.com.br",
      "https://*.google-analytics.com",
      "https://*.google.com",
      "https://*.clarity.ms",
      "https://www.facebook.com",
    ]) {
      expect(connect).toContain(origin);
    }
  });
});
