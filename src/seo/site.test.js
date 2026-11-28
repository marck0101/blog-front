import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { API_URL, BLOG_FAQ, DEFAULT_IMAGE, SEASONS_FAQ, blogHomeSchema, postImage, postSchema, resolveSiteFaq, seasonsIndexSchema } from "./site";

describe("imagem de compartilhamento do post (capa automática)", () => {
  const base = { slug: "meu-post", title: "Meu post", publishedAt: "2026-11-13T12:00:00Z", updatedAt: "2026-11-20T12:00:00Z" };

  it("capa própria nunca é trocada", () => {
    expect(postImage({ ...base, coverImage: "https://x.com/capa.webp" })).toBe("https://x.com/capa.webp");
  });

  it("sem capa usa a capa automática da API, com versão pela data de edição", () => {
    expect(postImage(base)).toBe(`${API_URL}/posts/slug/meu-post/cover.png?v=${new Date(base.updatedAt).getTime()}`);
  });

  it("sem capa e sem data de edição, a URL sai sem versão", () => {
    expect(postImage({ slug: "meu-post" })).toBe(`${API_URL}/posts/slug/meu-post/cover.png`);
  });

  it("sem slug cai na imagem padrão do site", () => {
    expect(postImage({ title: "x" })).toBe(DEFAULT_IMAGE);
    expect(postImage(null)).toBe(DEFAULT_IMAGE);
  });

  it("slug é escapado na URL", () => {
    expect(postImage({ slug: "a/b?c" })).toContain("/slug/a%2Fb%3Fc/cover.png");
  });

  it("JSON-LD usa a capa automática quando não há capa própria", () => {
    const post = postSchema(base)["@graph"].find((n) => n["@type"] === "BlogPosting");
    expect(post.image).toEqual([postImage(base)]);
  });
});

describe("autoCoverUrl", () => {
  it("acrescenta tema e versão; sem slug devolve vazio", async () => {
    const { autoCoverUrl } = await import("./site");
    expect(autoCoverUrl({ slug: "a", updatedAt: "2026-11-01T00:00:00Z" }, "escuro")).toMatch(/\/posts\/slug\/a\/cover\.png\?v=\d+&tema=escuro$/);
    expect(autoCoverUrl({ slug: "a" })).toMatch(/cover\.png$/);
    expect(autoCoverUrl({})).toBe("");
  });
});

describe("Person schema", () => {
  it("sameAs exato", async () => {
    const { PERSON } = await import("./site");
    expect(PERSON.sameAs).toEqual([
      "https://www.linkedin.com/in/marcos-henrique-corr%C3%AAa-618392209/",
      "https://github.com/marck0101",
      "https://marck0101.com.br",
      "https://servicos.marck0101.com.br",
    ]);
  });
});

// OPS-01: a API é a fonte única do FAQ; BLOG_FAQ e SEASONS_FAQ são a reserva embutida.
// FAQ_HASH é o MESMO valor de tests/site/faq.test.mjs no blog-backend: texto mudou lá,
// copie para cá e atualize o hash nos dois repositórios.
describe("FAQ do blog: reserva igual à fonte da API", () => {
  const FAQ_HASH = "d0691d37ae41d34cac632e82a1442637cab7ab6b05d1f388aeefe462a332d1d5";

  it("o conteúdo da reserva bate com o hash do backend", () => {
    const hash = createHash("sha256").update(JSON.stringify({ blog: BLOG_FAQ, seasons: SEASONS_FAQ })).digest("hex");
    expect(hash).toBe(FAQ_HASH);
  });

  it("copy: sem pequeno/grande/PME (usar negócios locais)", () => {
    expect(JSON.stringify([...BLOG_FAQ, ...SEASONS_FAQ])).not.toMatch(/\b(pequen[oa]s?|grandes?|PMEs?)\b/i);
  });

  it("resolveSiteFaq usa a resposta da API quando válida", () => {
    const raw = { blog: [{ question: "P?", answer: "R." }], seasons: [{ question: "Q?", answer: "S." }] };
    expect(resolveSiteFaq(raw)).toEqual(raw);
  });

  it("resolveSiteFaq cai na reserva se a API vier vazia, nula ou fora do formato", () => {
    for (const raw of [undefined, null, {}, { blog: "x", seasons: [] }, { blog: [{ question: "", answer: "" }] }]) {
      expect(resolveSiteFaq(raw)).toEqual({ blog: BLOG_FAQ, seasons: SEASONS_FAQ });
    }
  });

  it("resolveSiteFaq troca só a lista válida", () => {
    const blog = [{ question: "P?", answer: "R." }];
    expect(resolveSiteFaq({ blog, seasons: null })).toEqual({ blog, seasons: SEASONS_FAQ });
  });

  it("o schema FAQPage usa o FAQ recebido (API), não só a reserva", () => {
    const faq = [{ question: "Nova?", answer: "Sim." }];
    const json = JSON.stringify(blogHomeSchema([], faq));
    expect(json).toContain("Nova?");
    expect(json).not.toContain(BLOG_FAQ[0].question);
    expect(JSON.stringify(seasonsIndexSchema([], faq))).toContain("Nova?");
  });
});
