import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { headingText, readingProgress, slugifyHeading, tocItems, withHeadingIds } from "./headings";
import PostToc from "../components/PostToc";

vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "./analytics";

afterEach(cleanup);

describe("âncoras dos intertítulos", () => {
  it("gera id sem acento nem pontuação", () => {
    expect(slugifyHeading("Quanto custa um site?")).toBe("quanto-custa-um-site");
    expect(slugifyHeading("Ação & Reação: 2026")).toBe("acao-reacao-2026");
    expect(slugifyHeading("!!!")).toBe("secao");
  });

  it("lê o texto sem tags e com entidades", () => {
    expect(headingText("<strong>Prós</strong> &amp; contras&nbsp;")).toBe("Prós & contras");
  });

  it("põe id em h2 e h3, numera repetidos e mantém id existente", () => {
    const { html, headings } = withHeadingIds(
      '<h2>Começo</h2><p>x</p><h3 class="a">Detalhe</h3><h2>Começo</h2><h2 id="meu">Fim</h2><h4>Não</h4>'
    );
    expect(html).toContain('<h2 id="comeco">Começo</h2>');
    expect(html).toContain('<h3 id="detalhe" class="a">Detalhe</h3>');
    expect(html).toContain('<h2 id="comeco-2">Começo</h2>');
    expect(html).toContain('<h2 id="meu">Fim</h2>');
    expect(html).toContain("<h4>Não</h4>");
    expect(headings.map((h) => [h.id, h.level])).toEqual([
      ["comeco", 2],
      ["detalhe", 3],
      ["comeco-2", 2],
      ["meu", 2],
    ]);
  });

  it("ignora intertítulo vazio e conteúdo vazio", () => {
    expect(withHeadingIds("<h2><br></h2>").headings).toEqual([]);
    expect(withHeadingIds(undefined)).toEqual({ html: "", headings: [] });
  });

  it("sumário só com h2 e a partir de 3 seções", () => {
    const h = (level, id) => ({ id, text: id, level });
    expect(tocItems([h(2, "a"), h(3, "b"), h(2, "c")])).toEqual([]);
    expect(tocItems([h(2, "a"), h(3, "b"), h(2, "c"), h(2, "d")]).map((x) => x.id)).toEqual(["a", "c", "d"]);
  });
});

describe("barra de leitura", () => {
  it("vai de 0 a 1 conforme o texto passa pela tela", () => {
    expect(readingProgress({ top: 300, bottom: 3300, height: 3000 }, 1000)).toBe(0);
    expect(readingProgress({ top: -1000, bottom: 2000, height: 3000 }, 1000)).toBe(0.5);
    expect(readingProgress({ top: -2500, bottom: 500, height: 3000 }, 1000)).toBe(1);
  });

  it("texto que cabe na tela enche quando o fim aparece", () => {
    expect(readingProgress({ top: 200, bottom: 700, height: 500 }, 1000)).toBe(1);
    expect(readingProgress({ top: 800, bottom: 1300, height: 500 }, 1000)).toBe(0);
  });
});

describe("sumário do post", () => {
  const headings = [
    { id: "um", text: "Um", level: 2 },
    { id: "um-a", text: "Um A", level: 3 },
    { id: "dois", text: "Dois", level: 2 },
    { id: "tres", text: "Três", level: 2 },
  ];

  it("lista os h2 com link para a âncora", () => {
    render(<PostToc headings={headings} postSlug="post" />);
    const nav = screen.getByRole("navigation", { name: "Sumário do post" });
    const links = nav.querySelectorAll("a");
    expect([...links].map((a) => a.getAttribute("href"))).toEqual(["#um", "#dois", "#tres"]);
    expect(nav.querySelector("details").open).toBe(true);
  });

  it("conta o clique", () => {
    render(<PostToc headings={headings} postSlug="post" />);
    fireEvent.click(screen.getByText("Dois"));
    expect(trackEvent).toHaveBeenCalledWith("toc_click", { post_slug: "post", position: 2 });
  });

  it("não aparece em post curto", () => {
    const { container } = render(<PostToc headings={headings.slice(0, 3)} postSlug="post" />);
    expect(container.innerHTML).toBe("");
  });
});
