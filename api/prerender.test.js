import { describe, expect, it } from "vitest";
import { aboutPage, clusterPage, postPage, postRedirectPath, privacyPage } from "./prerender";

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
  const render = async (tocOn, content) => {
    const { vi } = await import("vitest");
    const { default: handler } = await import("./prerender");
    const post = {
      _id: "a".repeat(24),
      slug: "teste",
      title: "Teste",
      category: "tecnologia",
      publishedAt: "2026-11-13T12:00:00Z",
      content: content || "<p>Oi</p><h2>Começo</h2><p>a</p><h2>Meio &amp; fim</h2><h3>Detalhe</h3><h2>Fim</h2>",
    };
    // O index.html do projeto (tem o marcador que o prerender exige)
    const { readFileSync } = await import("node:fs");
    const shell = readFileSync("index.html", "utf8");
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const json = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
      if (String(url).includes("/posts/slug/")) return json(post);
      if (String(url).includes("/settings/features")) return json({ features: { toc: tocOn } });
      if (String(url).includes("/api/")) return json([]);
      return { ok: true, status: 200, text: async () => shell, json: async () => ({}) };
    }));
    let body = "";
    const res = { setHeader() {}, status() { return res; }, send(b) { body = b; return res; }, end() { return res; } };
    await handler({ query: { slug: "teste" } }, res);
    vi.unstubAllGlobals();
    return body;
  };

  it("tem ids nos intertítulos e o sumário com 3+ seções", async () => {
    const body = await render(true);
    expect(body).toContain('<h2 id="comeco">Começo</h2>');
    expect(body).toContain('<h2 id="meio-fim">Meio &amp; fim</h2>');
    expect(body).toContain('<h3 id="detalhe">Detalhe</h3>');
    expect(body).toContain('aria-label="Sumário do post"');
    expect(body).toContain('<a href="#meio-fim" class="hover:underline">Meio &amp; fim</a>');
  });

  it("títulos já numerados: o sumário do HTML não numera de novo", async () => {
    const body = await render(true, "<h2>1 Introdução</h2><p>a</p><h2>2 Objetivo</h2><h2>3 Conclusão</h2>");
    expect(body).toMatch(/<ol class="[^"]*list-none/);
    expect(body).not.toMatch(/<ol class="[^"]*list-decimal/);
  });

  it("sumário desligado no painel não entra no HTML (as âncoras ficam)", async () => {
    const body = await render(false);
    expect(body).toContain('<h2 id="comeco">Começo</h2>');
    expect(body).not.toContain('aria-label="Sumário do post"');
  });
});

describe("política de privacidade no prerender", () => {
  const { head, body } = privacyPage();

  it("noindex, título e canonical próprios", () => {
    expect(head).toContain('name="robots" content="noindex"');
    expect(head).toContain("<title data-prerender>Política de Privacidade");
    expect(head).toContain('rel="canonical" href="https://blog.marck0101.com.br/privacidade"');
  });

  it("texto completo para quem não roda JavaScript", () => {
    expect(body).toContain("<h1>Política de Privacidade</h1>");
    expect(body).toContain("Quais dados coletamos");
    expect(body).toContain("Seus direitos (LGPD)");
    expect(body.length).toBeGreaterThan(5000);
  });

  it("sem dados estruturados (página noindex)", () => {
    expect(head).not.toContain("application/ld+json");
  });
});

describe("tema (cluster) no prerender", () => {
  const cluster = { slug: "dashboards-e-bi", title: "Dashboards e BI de marketing", description: "Dashboards que o cliente abre todo dia." };
  const pillar = { _id: "1", slug: "pilar", title: "Pilar <b>", directAnswer: "Resposta direta do pilar." };
  const posts = [{ _id: "2", slug: "satelite", title: "Satélite", excerpt: "Resumo" }];
  const { head, body } = clusterPage({ cluster, pillar, posts });

  it("título, canonical e CollectionPage com o pilar primeiro", () => {
    expect(head).toContain("<title data-prerender>Dashboards e BI de marketing | Tema |");
    expect(head).toContain('rel="canonical" href="https://blog.marck0101.com.br/temas/dashboards-e-bi"');
    const schema = JSON.parse(head.match(/<script data-prerender type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const page = schema["@graph"].find((n) => n["@type"] === "CollectionPage");
    expect(page.mainEntity.itemListElement.map((i) => i.url)).toEqual([
      "https://blog.marck0101.com.br/blog/pilar",
      "https://blog.marck0101.com.br/blog/satelite",
    ]);
  });

  it("links do pilar e dos relacionados para quem não roda JS, com HTML escapado", () => {
    expect(body).toContain('<a href="/blog/pilar">Pilar &lt;b&gt;</a>');
    expect(body).toContain("Resposta direta do pilar.");
    expect(body).toContain('<li><a href="/blog/satelite">Satélite</a> — Resumo</li>');
  });

  it("tema sem pilar e com season: a série vira a porta de entrada", () => {
    const seg = { slug: "seguranca-na-diretoria", title: "Segurança", description: "x", season: "seguranca-e-pauta-de-diretoria" };
    const out = clusterPage({ cluster: seg, pillar: null, posts }).body;
    expect(out).toContain("Comece pela série");
    expect(out).toContain('href="/seasons/seguranca-e-pauta-de-diretoria"');
    // Com pilar, o pilar vem primeiro e a série não aparece
    expect(clusterPage({ cluster: seg, pillar, posts }).body).not.toContain("Comece pela série");
  });
});

describe("post com tema no prerender", () => {
  const cluster = {
    cluster: { slug: "dashboards-e-bi", title: "Dashboards e BI" },
    pillar: { slug: "pilar", title: "O pilar" },
    posts: [{ slug: "atual", title: "Atual" }, { slug: "vizinho", title: "Vizinho" }],
  };
  const post = { _id: "1", slug: "atual", title: "Atual", content: "<p>Texto do post.</p>", category: "tecnologia", cluster: "dashboards-e-bi", publishedAt: "2026-11-20" };

  it("tema no breadcrumb, pilar e vizinhos no fim, isPartOf aponta a página do tema", () => {
    const { head, root } = postPage(post, { cluster });
    expect(root).toContain('<a href="/temas/dashboards-e-bi" class="hover:underline dark:hover:text-gray-100">Dashboards e BI</a>');
    expect(root).toContain('aria-label="Mais deste tema: Dashboards e BI"');
    expect(root).toContain('<a href="/blog/pilar"');
    expect(root).toContain('<a href="/blog/vizinho"');
    expect(root).not.toContain('<a href="/blog/atual"');
    expect(head).toContain('"@id":"https://blog.marck0101.com.br/temas/dashboards-e-bi#page"');
  });

  it("post sem tema não muda", () => {
    const { root } = postPage({ ...post, cluster: null }, { cluster: null });
    expect(root).not.toContain("/temas/");
  });
});

describe("página sobre no prerender", () => {
  const { head, body } = aboutPage();

  it("indexável, com ProfilePage e o Person com área atendida", () => {
    expect(head).toContain('name="robots" content="index, follow');
    expect(head).toContain('rel="canonical" href="https://blog.marck0101.com.br/sobre"');
    const schema = JSON.parse(head.match(/<script data-prerender type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const types = schema["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["ProfilePage", "Person"]));
    const person = schema["@graph"].find((n) => n["@type"] === "Person");
    expect(person.areaServed.map((a) => a.name)).toContain("Noroeste do Rio Grande do Sul");
  });

  it("texto completo para quem não roda JavaScript", () => {
    expect(body).toContain("<h1>Sobre o autor</h1>");
    expect(body).toContain("Quem escreve");
    expect(body).toContain("noroeste do Rio Grande do Sul");
  });
});
