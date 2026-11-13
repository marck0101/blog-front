import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  canResume,
  clearHistory,
  getHistory,
  READ_PERCENT,
  recordProgress,
  splitHistory,
  statusOf,
} from "./readingHistory";
import { saveFeatures } from "./features";

vi.mock("./analytics", () => ({ trackEvent: vi.fn(), setPageContext: vi.fn(), isAuthorBrowser: () => false }));
vi.mock("../services/posts.service", () => ({
  default: { getPublished: vi.fn(async () => ({ posts: [], total: 12 })), engage: vi.fn() },
}));
vi.mock("../services/subscriber.service", () => ({ default: { getCategories: vi.fn(async () => []) } }));
// A página por dentro: o layout (header/rodapé) e o SEO têm testes próprios
vi.mock("../layouts/BlogLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../components/SEO", () => ({ default: () => null }));

import { trackEvent } from "./analytics";
import PostCard from "../components/PostCard";
import ResumeReading from "../components/ResumeReading";
import Favorites from "../pages/Blog/Favorites";

const post = (slug, extra = {}) => ({
  slug,
  _id: `id-${slug}`,
  title: `Post ${slug}`,
  category: "tecnologia",
  publishedAt: "2026-11-01T12:00:00Z",
  ...extra,
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/blog/um-post");
});
afterEach(cleanup);

describe("histórico de leitura", () => {
  it("só uma olhada (< 5%) não vira registro", () => {
    expect(recordProgress(post("a"), 3)).toBeNull();
    expect(getHistory()).toEqual({});
  });

  it("anota o máximo (que nunca diminui) e onde parou", () => {
    recordProgress(post("a"), 40);
    recordProgress(post("a"), 20);
    const e = getHistory().a;
    expect(e.max).toBe(40);
    expect(e.pos).toBe(20);
    expect(statusOf(e)).toBe("lendo");
    expect(e.title).toBe("Post a");
  });

  it(`passa de ${READ_PERCENT}% = lido, e continua lido mesmo voltando ao topo`, () => {
    recordProgress(post("a"), 80);
    recordProgress(post("a"), 10);
    const e = getHistory().a;
    expect(statusOf(e)).toBe("lido");
    expect(e.readAt).toBeTruthy();
  });

  it("valores fora da faixa ficam entre 0 e 100", () => {
    recordProgress(post("a"), 250);
    expect(getHistory().a.max).toBe(100);
  });

  it("continuar de onde parou: só no meio do texto", () => {
    expect(canResume({ pos: 3 })).toBe(false);
    expect(canResume({ pos: 42 })).toBe(true);
    expect(canResume({ pos: 98 })).toBe(false);
  });

  it("separa lendo e lidos, os mais recentes primeiro", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T10:00:00Z"));
    recordProgress(post("velho"), 30);
    vi.setSystemTime(new Date("2026-11-13T11:00:00Z"));
    recordProgress(post("novo"), 50);
    recordProgress(post("lido"), 90);
    vi.useRealTimers();
    const { reading, read } = splitHistory(getHistory());
    expect(reading.map((e) => e.slug)).toEqual(["novo", "velho"]);
    expect(read.map((e) => e.slug)).toEqual(["lido"]);
  });

  it("guarda no máximo 200 posts (corta os mais antigos)", () => {
    const all = {};
    for (let i = 0; i < 200; i++) {
      all[`p${i}`] = { slug: `p${i}`, max: 50, pos: 50, updatedAt: new Date(2026, 0, 1, 0, i).toISOString() };
    }
    localStorage.setItem("reading-history", JSON.stringify(all));
    recordProgress(post("novo"), 50);
    const keys = Object.keys(getHistory());
    expect(keys).toHaveLength(200);
    expect(keys).toContain("novo");
    expect(keys).not.toContain("p0");
  });

  it("valor estragado no navegador vira histórico vazio", () => {
    localStorage.setItem("reading-history", "{oops");
    expect(getHistory()).toEqual({});
    localStorage.setItem("reading-history", "[1,2]");
    expect(getHistory()).toEqual({});
  });

  it("apagar o histórico", () => {
    recordProgress(post("a"), 50);
    clearHistory();
    expect(getHistory()).toEqual({});
  });
});

describe("cartão do post", () => {
  it("mostra \"42% lido\" e \"Lido\"", () => {
    act(() => {
      recordProgress(post("a"), 42);
      recordProgress(post("b"), 90);
    });
    render(
      <MemoryRouter>
        <PostCard post={post("a")} />
        <PostCard post={post("b")} variant="list" />
        <PostCard post={post("c")} variant="compact" />
      </MemoryRouter>
    );
    expect(screen.getByText("42% lido")).toBeTruthy();
    expect(screen.getByText("Lido")).toBeTruthy();
    expect(screen.getAllByText(/lido/i)).toHaveLength(2); // o "c" não foi aberto
  });

  it("recurso desligado no painel: nada aparece", () => {
    act(() => recordProgress(post("a"), 42));
    act(() => saveFeatures({ readingHistory: false }));
    render(<MemoryRouter><PostCard post={post("a")} /></MemoryRouter>);
    expect(screen.queryByText("42% lido")).toBeNull();
    act(() => saveFeatures({ readingHistory: true }));
  });
});

describe("continuar de onde parou", () => {
  const ref = () => ({ current: { getBoundingClientRect: () => ({ top: 500, height: 5000 }) } });

  it("oferece e leva ao ponto onde parou", () => {
    act(() => recordProgress(post("a"), 40));
    window.scrollTo = vi.fn();
    render(<ResumeReading slug="a" contentRef={ref()} />);
    expect(screen.getByText(/Você parou em/).textContent).toContain("40%");
    fireEvent.click(screen.getByRole("button", { name: "Continuar de onde parou" }));
    // topo do texto (500) + 40% de (5000 - altura da tela 768)
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500 + (4232 * 40) / 100 });
    expect(trackEvent).toHaveBeenCalledWith("resume_reading", { post_slug: "a", percent: 40 });
    expect(screen.queryByText(/Você parou em/)).toBeNull();
  });

  it("link para uma seção (#secao) não oferece", () => {
    act(() => recordProgress(post("a"), 40));
    window.history.replaceState(null, "", "/blog/a#meio");
    const { container } = render(<ResumeReading slug="a" contentRef={ref()} />);
    expect(container.innerHTML).toBe("");
  });

  it("post já lido até o fim: só avisa", () => {
    act(() => recordProgress(post("a"), 100));
    render(<ResumeReading slug="a" contentRef={ref()} />);
    expect(screen.getByText("Você já leu este post.")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Minhas leituras", () => {
  it("resume quantos posts leu e separa as listas", async () => {
    act(() => {
      recordProgress(post("a"), 90);
      recordProgress(post("b"), 30);
    });
    render(<MemoryRouter><Favorites /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/Você leu/).textContent).toMatch(/Você leu 1 de 12 posts do blog \(8%\)/));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("8");
    expect(screen.getByRole("heading", { name: /Lendo agora/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Já lidos/ })).toBeTruthy();
  });

  it("apagar o histórico pede confirmação e mantém os favoritos", async () => {
    act(() => recordProgress(post("a"), 90));
    localStorage.setItem("favorite-posts", JSON.stringify([post("fav")]));
    render(<MemoryRouter><Favorites /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Apagar meu histórico/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    expect(getHistory()).toEqual({});
    expect(JSON.parse(localStorage.getItem("favorite-posts"))).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Já lidos/ })).toBeNull());
  });
});
