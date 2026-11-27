import { describe, expect, it } from "vitest";
import { cleanRef, originPath, originRef, preDiagnosticoLink, refLine } from "./preOrigin";

describe("preOrigin", () => {
  it("aceita só /blog e /blog/<slug>, sem query nem hash", () => {
    expect(originPath("/blog/meu-post")).toBe("/blog/meu-post");
    expect(originPath("/blog/meu-post/?utm_source=x&email=a@b.com#topo")).toBe("/blog/meu-post");
    expect(originPath("/blog/")).toBe("/blog");
    expect(originPath("/BLOG/Meu-Post")).toBe("/blog/meu-post");
  });

  it("recusa o que não é página do blog (admin, outros sites, lixo, slug longo)", () => {
    for (const bad of ["/admin/posts", "https://evil.com/blog/x", "//evil.com", "/blog/a/b", "/blog/jo%C3%A3o", "/blog/a b", "", null, undefined, `/blog/${"a".repeat(61)}`]) {
      expect(originPath(bad)).toBe("");
    }
  });

  it("ref no formato blog-<slug>; home do blog vira blog-home", () => {
    expect(originRef("/blog/como-aparecer-no-google")).toBe("blog-como-aparecer-no-google");
    expect(originRef("/blog")).toBe("blog-home");
    expect(originRef("/sobre")).toBe("");
  });

  it("cleanRef limpa o que a pessoa digita e limita a 70 caracteres", () => {
    expect(cleanRef("Meu Post!! joao@x.com")).toBe("meu-post-joao-x-com");
    expect(cleanRef("a".repeat(200))).toHaveLength(70);
    expect(cleanRef(null)).toBe("");
  });

  it("refLine: última linha da mensagem; vazia sem referência", () => {
    expect(refLine("blog-x")).toBe("[ref: blog-x]");
    expect(refLine("--")).toBe("");
    expect(refLine("")).toBe("");
  });

  it("preDiagnosticoLink leva a origem só quando válida", () => {
    expect(preDiagnosticoLink("/blog/x?utm=1")).toBe("/pre-diagnostico?de=/blog/x");
    expect(preDiagnosticoLink("/admin")).toBe("/pre-diagnostico");
  });
});
