import { describe, expect, it } from "vitest";
import { API_URL, DEFAULT_IMAGE, postImage, postSchema } from "./site";

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
