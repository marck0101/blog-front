import { beforeEach, describe, expect, it, vi } from "vitest";

// SEC-02: dados do prerender como bloco JSON, sem script inline executável
describe("readBlock", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    delete window.__PRERENDERED_POST__;
  });

  it("lê o bloco JSON, inclusive texto com </script> escapado pelo prerender", async () => {
    // Mesmo formato do jsonBlock/safeJson de api/prerender.js
    const json = JSON.stringify({ slug: "a", content: "<p>x</p></script>" }).replace(/</g, "\\u003c");
    document.body.innerHTML = `<script type="application/json" id="prerendered-post">${json}</script>`;
    const { readBlock } = await import("./prerendered");
    expect(readBlock("prerendered-post")).toEqual({ slug: "a", content: "<p>x</p></script>" });
  });

  it("HTML antigo ainda em cache na CDN (window.__PRERENDERED_*) continua funcionando", async () => {
    window.__PRERENDERED_POST__ = { slug: "antigo" };
    const { readBlock } = await import("./prerendered");
    expect(readBlock("prerendered-post")).toEqual({ slug: "antigo" });
  });

  it("bloco inválido não quebra a página", async () => {
    document.body.innerHTML = '<script type="application/json" id="prerendered-data">{quebrado</script>';
    const { readBlock, prerendered } = await import("./prerendered");
    expect(readBlock("prerendered-data")).toBeUndefined();
    expect(prerendered("categories")).toBeUndefined();
  });
});
