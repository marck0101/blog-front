import { describe, expect, it } from "vitest";
import { postRedirectPath } from "./prerender";

// BIZ-04: link antigo de post vira 301 para o endereço atual
describe("postRedirectPath", () => {
  it("endereço atual: sem redirecionamento", () => {
    expect(postRedirectPath("guia-seo", { slug: "guia-seo" })).toBeNull();
  });

  it("post não encontrado: sem redirecionamento (fica 404)", () => {
    expect(postRedirectPath("x", null)).toBeNull();
  });

  it("endereço antigo: leva ao atual", () => {
    expect(postRedirectPath("guia-antigo", { slug: "guia-seo" })).toBe("/blog/guia-seo");
  });

  it("mantém UTMs e outros parâmetros do visitante, sem os da reescrita", () => {
    const path = postRedirectPath("guia-antigo", { slug: "guia-seo" }, {
      slug: "guia-antigo",
      utm_source: "linkedin",
      utm_medium: "social",
    });
    expect(path).toBe("/blog/guia-seo?utm_source=linkedin&utm_medium=social");
  });
});

// Sumário e âncoras: o HTML do servidor sai igual ao do React (PostToc)
describe("post no prerender", () => {
  it("tem ids nos intertítulos e o sumário com 3+ seções", async () => {
    const { vi } = await import("vitest");
    const { default: handler } = await import("./prerender");
    const post = {
      _id: "a".repeat(24),
      slug: "teste",
      title: "Teste",
      category: "tecnologia",
      publishedAt: "2026-11-13T12:00:00Z",
      content: "<p>Oi</p><h2>Começo</h2><p>a</p><h2>Meio &amp; fim</h2><h3>Detalhe</h3><h2>Fim</h2>",
    };
    // O index.html do projeto (tem o marcador que o prerender exige)
    const { readFileSync } = await import("node:fs");
    const shell = readFileSync("index.html", "utf8");
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const json = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
      if (String(url).includes("/posts/slug/")) return json(post);
      if (String(url).includes("/api/")) return json([]);
      return { ok: true, status: 200, text: async () => shell, json: async () => ({}) };
    }));
    let body = "";
    const res = { setHeader() {}, status() { return res; }, send(b) { body = b; return res; }, end() { return res; } };
    await handler({ query: { slug: "teste" } }, res);
    vi.unstubAllGlobals();

    expect(body).toContain('<h2 id="comeco">Começo</h2>');
    expect(body).toContain('<h2 id="meio-fim">Meio &amp; fim</h2>');
    expect(body).toContain('<h3 id="detalhe">Detalhe</h3>');
    expect(body).toContain('aria-label="Sumário do post"');
    expect(body).toContain('<a href="#meio-fim" class="hover:underline">Meio &amp; fim</a>');
  });
});
