import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import GeneratedCover from ".";

const post = { slug: "meu-post", title: "Meu post", updatedAt: "2026-11-01T00:00:00Z" };

describe("GeneratedCover", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
  });

  it("com slug mostra a capa automática 1200x630, sem layout shift", () => {
    render(<GeneratedCover post={post} title={post.title} category="design" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("/posts/slug/meu-post/cover.png");
    expect(img.getAttribute("src")).toContain("tema=claro");
    expect(img.getAttribute("width")).toBe("1200");
    expect(img.getAttribute("height")).toBe("630");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("alt")).toContain("Meu post");
  });

  it("pede o tema escuro quando o site está no escuro", () => {
    document.documentElement.classList.add("dark");
    render(<GeneratedCover post={post} />);
    expect(screen.getByRole("img").getAttribute("src")).toContain("tema=escuro");
  });

  it("sem slug mostra o bloco liso, sem degradê", () => {
    render(<GeneratedCover title="Temporada" categoryLabel="Season" />);
    expect(screen.queryByRole("img")).toBeNull();
    const box = screen.getByTestId("capa-lisa");
    expect(box.className).not.toMatch(/gradient|from-|to-/);
    expect(box.getAttribute("style")).not.toMatch(/gradient/);
    expect(box.textContent).toContain("Season");
    expect(box.textContent).toContain("Temporada");
  });

  it("se a imagem falhar, cai no bloco liso com a categoria e o título", () => {
    render(<GeneratedCover post={post} title="Meu post" categoryLabel="Design" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    const box = screen.getByTestId("capa-lisa");
    expect(box.textContent).toContain("Design");
    expect(box.textContent).toContain("Meu post");
  });
});
