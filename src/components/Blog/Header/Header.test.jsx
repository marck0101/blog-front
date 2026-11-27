import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { saveFeatures } from "../../../utils/features";
import { toggleFavorite } from "../../../utils/favorites";

vi.mock("../../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../../services/subscriber.service", () => ({ default: { getCategories: vi.fn(async () => []) } }));
vi.mock("../../../services/seasons.service", () => ({ default: { getPublic: vi.fn(async () => []) } }));
vi.mock("../../ThemeToggle", () => ({ default: () => null }));
vi.mock("../../SkinToggle", () => ({ default: () => null }));

import BlogHeader from "./index";
import SuggestTopicCard from "../../SuggestTopicCard";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BlogHeader />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Minhas leituras no cabeçalho", () => {
  it("abre Minhas leituras e, clicando de novo lá dentro, volta para todas as publicações", () => {
    toggleFavorite({ slug: "a", title: "A" });
    renderAt("/blog");
    const open = screen.getByTitle("Minhas leituras");
    expect(open.getAttribute("href")).toBe("/favoritos");
    expect(open.getAttribute("aria-pressed")).toBe("false");
    cleanup();

    renderAt("/favoritos");
    const close = screen.getByTitle("Ver todas as publicações");
    expect(close.getAttribute("href")).toBe("/blog");
    expect(close.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("Sugira um tema", () => {
  it("aparece como etiqueta no cabeçalho, guardando a página de origem", () => {
    renderAt("/blog/um-post");
    const chips = screen.getAllByRole("link", { name: /Sugira um tema/ });
    expect(chips[0].getAttribute("href")).toBe("/sugestoes?de=%2Fblog%2Fum-post");
  });

  it("some quando o recurso está desligado no painel", () => {
    saveFeatures({ suggestions: false });
    render(
      <MemoryRouter initialEntries={["/blog"]}>
        <SuggestTopicCard />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link", { name: /Sugira um tema/ })).toBeNull();
  });
});
