import { describe, expect, it } from "vitest";
import { bounds, connectionsOf, createSimulation, filterGraph, neighborsOf, nodeRadius } from "./graphLayout";

const post = (id, extra = {}) => ({ id, type: "post", label: id, status: "published", views: 0, ...extra });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const data = {
  nodes: [post("a"), post("b"), post("rascunho", { status: "draft" }), { id: "tag:ga4", type: "tag", count: 2 }, { id: "season:s", type: "season" }],
  links: [
    { source: "a", target: "b", type: "link" },
    { source: "b", target: "a", type: "related" },
    { source: "a", target: "tag:ga4", type: "tag" },
    { source: "rascunho", target: "tag:ga4", type: "tag" },
    { source: "rascunho", target: "season:s", type: "season" },
  ],
};

describe("filtros do mapa", () => {
  it("sem filtro, tudo", () => {
    expect(filterGraph(data).nodes).toHaveLength(5);
  });

  it("sem rascunhos: some o rascunho e a season que só ele usava", () => {
    const g = filterGraph(data, { drafts: false });
    expect(g.nodes.map((n) => n.id)).toEqual(["a", "b", "tag:ga4"]);
    expect(g.links.every((l) => l.source !== "rascunho")).toBe(true);
  });

  it("sem tags e sem leituras sugeridas", () => {
    const g = filterGraph(data, { tags: false, related: false });
    expect(g.nodes.some((n) => n.type === "tag")).toBe(false);
    expect(g.links.map((l) => l.type)).toEqual(["link", "season"]);
  });

  it("filtro por categoria: só os posts dela (uma ou várias), e as tags que eles usam", () => {
    const g = {
      nodes: [post("t", { category: "tecnologia" }), post("g", { category: "growth" }), post("d", { category: "design" }), { id: "tag:x", type: "tag" }, { id: "tag:y", type: "tag" }],
      links: [
        { source: "t", target: "tag:x", type: "tag" },
        { source: "d", target: "tag:y", type: "tag" },
        { source: "t", target: "d", type: "link" },
      ],
    };
    expect(filterGraph(g, { categories: ["growth"] }).nodes.map((n) => n.id)).toEqual(["g"]);
    const two = filterGraph(g, { categories: ["tecnologia", "growth"] });
    expect(two.nodes.map((n) => n.id)).toEqual(["t", "g", "tag:x"]);
    expect(two.links).toEqual([{ source: "t", target: "tag:x", type: "tag" }]);
    expect(filterGraph(g, { categories: [] }).nodes).toHaveLength(5);
  });

  it("post sem ligação continua no mapa (é o órfão que interessa ver)", () => {
    const g = filterGraph({ nodes: [post("sozinho")], links: [] });
    expect(g.nodes).toHaveLength(1);
  });
});

describe("vizinhos e ligações", () => {
  it("vizinhos nos dois sentidos", () => {
    expect([...neighborsOf("a", data.links)].sort()).toEqual(["b", "tag:ga4"]);
  });

  it("ligações separadas por sentido e tipo", () => {
    expect(connectionsOf("a", data.links)).toEqual({
      linksOut: ["b"],
      linksIn: [],
      relatedOut: [],
      relatedIn: ["b"],
      tags: ["tag:ga4"],
      seasons: [],
    });
  });
});

describe("simulação", () => {
  it("posts ligados ficam mais perto que os soltos, sem NaN, e assenta", () => {
    const nodes = [post("a"), post("b"), post("c"), post("d"), post("e"), post("f")];
    const links = [
      { source: "a", target: "b", type: "link" },
      { source: "b", target: "c", type: "link" },
    ];
    const sim = createSimulation(nodes, links);
    sim.run(400);
    const [a, b, , , , f] = sim.nodes;
    expect(sim.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
    expect(dist(a, b)).toBeLessThan(dist(a, f));
    expect(sim.isSettled()).toBe(true);
  });

  it("mesmos dados, mesmo desenho", () => {
    const one = createSimulation(data.nodes, data.links);
    const two = createSimulation(data.nodes, data.links);
    one.run(50);
    two.run(50);
    expect(one.nodes.map((n) => [n.x, n.y])).toEqual(two.nodes.map((n) => [n.x, n.y]));
  });

  it("nó fixado ao arrastar não sai do lugar; reaquecer volta a mexer", () => {
    const sim = createSimulation(data.nodes, data.links);
    sim.run(300);
    const a = sim.node("a");
    a.fx = 500;
    a.fy = -200;
    sim.reheat();
    expect(sim.isSettled()).toBe(false);
    sim.run(20);
    expect([a.x, a.y]).toEqual([500, -200]);
  });

  it("ligação para nó inexistente é ignorada", () => {
    const sim = createSimulation([post("a")], [{ source: "a", target: "sumiu", type: "link" }]);
    expect(sim.links).toHaveLength(0);
    expect(() => sim.run(5)).not.toThrow();
  });
});

describe("tamanho e enquadramento", () => {
  it("post mais lido é maior, com teto", () => {
    expect(nodeRadius(post("x", { views: 900 }))).toBeGreaterThan(nodeRadius(post("y", { views: 10 })));
    expect(nodeRadius(post("z", { views: 10_000_000 }))).toBe(18);
  });

  it("caixa contém todos os nós com margem", () => {
    expect(bounds([{ x: 0, y: 0 }, { x: 100, y: 50 }], 10)).toEqual({ x: -10, y: -10, width: 120, height: 70 });
  });
});
