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
