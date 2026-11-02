import { describe, expect, it } from "vitest";
import { safeHtml } from "./safeHtml";

// SEC-01: segunda camada de limpeza na hora de exibir
describe("safeHtml", () => {
  it.each([
    ["script", "<p>a</p><script>alert(1)</script>"],
    ["evento onerror", '<img src="https://x/a.webp" onerror="alert(1)">'],
    ["javascript: no link", '<a href="javascript:alert(1)">x</a>'],
    ["formulário", '<form action="https://evil.example"><input name="senha"></form>'],
    ["style", "<style>body{display:none}</style><p>a</p>"],
  ])("remove %s", (_, html) => {
    expect(safeHtml(html)).not.toMatch(/alert|onerror|<form|<input|<style|javascript:/i);
  });

  it("mantém o que o editor produz, inclusive link em nova aba", () => {
    const html =
      '<h2>Título</h2><p style="text-align: center;"><strong>a</strong></p>' +
      '<a href="https://site.com" target="_blank" rel="noopener noreferrer">link</a>' +
      '<img src="https://x/a.webp" alt="Capa" width="1200" height="630">';
    const clean = safeHtml(html);
    for (const piece of ["<h2>Título</h2>", "text-align: center", "<strong>a</strong>", 'target="_blank"', 'alt="Capa"', 'width="1200"']) {
      expect(clean).toContain(piece);
    }
  });

  it("vazio continua vazio", () => {
    expect(safeHtml(undefined)).toBe("");
    expect(safeHtml("")).toBe("");
  });
});
