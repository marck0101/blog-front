import { describe, expect, it } from "vitest";
import { clusterLinks } from "./clusterLinks";

const cluster = { slug: "dashboards-e-bi", title: "Dashboards e BI" };
const p = (slug) => ({ slug, title: slug });
const data = { cluster, pillar: p("pilar"), posts: [p("a"), p("b"), p("c"), p("d"), p("e")] };

describe("clusterLinks", () => {
  it("post comum: pilar + até 3 vizinhos, sem ele mesmo", () => {
    const links = clusterLinks({ slug: "b", cluster: cluster.slug }, data);
    expect(links.pillar.slug).toBe("pilar");
    expect(links.items.map((i) => i.slug)).toEqual(["a", "c", "d"]);
    expect(links.url).toBe("/temas/dashboards-e-bi");
  });

  it("pilar: lista todos os outros posts do tema", () => {
    const links = clusterLinks({ slug: "pilar", cluster: cluster.slug }, data);
    expect(links.isPillar).toBe(true);
    expect(links.pillar).toBeNull();
    expect(links.items).toHaveLength(5);
  });

  it("sem tema, dados de outro tema ou nada para linkar: null", () => {
    expect(clusterLinks({ slug: "a" }, data)).toBeNull();
    expect(clusterLinks({ slug: "a", cluster: "outro" }, data)).toBeNull();
    expect(clusterLinks({ slug: "a", cluster: cluster.slug }, { cluster, pillar: null, posts: [p("a")] })).toBeNull();
  });
});
