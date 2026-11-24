import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../layouts/BlogLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../hooks/useToast", () => ({ useToast: () => vi.fn() }));
vi.mock("../../services/subscriber.service", () => ({
  default: {
    getCategories: vi.fn(async () => [
      { slug: "tecnologia", label: "Tecnologia" },
      { slug: "design", label: "Design" },
    ]),
  },
}));
vi.mock("../../services/posts.service", () => ({
  default: {
    getAll: vi.fn(async () => ({
      posts: [
        { _id: "p1", title: "Post no ar", published: true, status: "published" },
        { _id: "p2", title: "Post em rascunho", published: false, status: "draft" },
      ],
    })),
  },
}));
vi.mock("../../services/suggestions.service", () => ({
  default: {
    send: vi.fn(async () => ({ message: "Sugestão recebida. Obrigado!" })),
    listPublic: vi.fn(async () => []),
    newCount: vi.fn(async () => 0),
    adminList: vi.fn(),
    update: vi.fn(async () => ({ notified: false })),
    remove: vi.fn(),
  },
}));

import SuggestionsService from "../../services/suggestions.service";
import { saveFeatures } from "../../utils/features";
import Suggestions from "./Suggestions";
import AdminSuggestions from "../Admin/Suggestions";

const renderAt = (ui, path = "/sugestoes") => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("caixinha de sugestões (leitor)", () => {
  it("só envia com assunto, texto e email; assinar é opcional e começa desmarcado", async () => {
    renderAt(<Suggestions />, "/sugestoes?de=%2Fblog%2Fum-post&assunto=design");
    const send = screen.getByRole("button", { name: "Enviar sugestão" });
    expect(send.disabled).toBe(true);

    await screen.findByRole("option", { name: "Design" });
    expect(screen.getByLabelText(/Assunto/)).toHaveProperty("value", "design");
    expect(screen.getByRole("checkbox", { name: /receber os próximos artigos/ }).checked).toBe(false);

    fireEvent.change(screen.getByLabelText(/Sua sugestão/), { target: { value: "Fala de Core Web Vitals" } });
    fireEvent.change(screen.getByLabelText(/Seu email/), { target: { value: "ana@x.dev" } });
    expect(send.disabled).toBe(false);
    fireEvent.click(send);

    await screen.findByText("Sugestão recebida. Obrigado!");
    expect(SuggestionsService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "topic",
        category: "design",
        message: "Fala de Core Web Vitals",
        email: "ana@x.dev",
        subscribe: false,
        allowName: false,
        website: "",
        sourcePath: "/blog/um-post",
      })
    );
    expect(screen.getByText(/Se ela virar post, te mando o link/)).toBeTruthy();
  });

  it("texto curto demais não libera o envio", async () => {
    renderAt(<Suggestions />, "/sugestoes?assunto=design");
    fireEvent.change(screen.getByLabelText(/Sua sugestão/), { target: { value: "curto" } });
    fireEvent.change(screen.getByLabelText(/Seu email/), { target: { value: "ana@x.dev" } });
    expect(screen.getByRole("button", { name: "Enviar sugestão" }).disabled).toBe(true);
    expect(screen.getByText("Pelo menos 10 caracteres")).toBeTruthy();
  });

  it("caixinha desligada em Recursos: sem formulário", () => {
    act(() => saveFeatures({ suggestions: false }));
    renderAt(<Suggestions />);
    expect(screen.queryByRole("button", { name: "Enviar sugestão" })).toBeNull();
    expect(screen.getByText(/A caixinha está fechada/)).toBeTruthy();
  });

  it("mostra as atendidas que o autor escolheu mostrar", async () => {
    SuggestionsService.listPublic.mockResolvedValueOnce([
      { _id: "1", category: "tecnologia", text: "Core Web Vitals", by: "Ana", post: { title: "CWV na prática", slug: "cwv" } },
      { _id: "2", category: "design", text: "Paleta", by: null, post: { title: "Cores", slug: "cores" } },
    ]);
    renderAt(<Suggestions />);
    expect(await screen.findByText("Vocês pediram, saiu")).toBeTruthy();
    expect(screen.getByText("Sugestão de Ana")).toBeTruthy();
    expect(screen.getByText("Sugestão de um leitor")).toBeTruthy();
    expect(screen.getByRole("link", { name: /CWV na prática/ }).getAttribute("href")).toBe("/blog/cwv");
  });
});

describe("caixinha de sugestões (painel)", () => {
  const suggestion = {
    _id: "s1",
    kind: "topic",
    category: "tecnologia",
    message: "Fala de Core Web Vitals em sites pequenos",
    name: "Ana",
    email: "ana@x.dev",
    allowName: true,
    status: "new",
    isPublic: false,
    notifiedAt: null,
    createdAt: "2026-11-20T12:00:00Z",
    updatedAt: "2026-11-20T12:00:00Z",
  };

  it("marcar como atendida: vitrine e aviso só liberam com post publicado", async () => {
    SuggestionsService.adminList.mockResolvedValue({
      suggestions: [suggestion],
      total: 1,
      page: 1,
      totalPages: 1,
      counts: { new: 1, planned: 0, done: 0, archived: 0 },
    });
    renderAt(<AdminSuggestions />, "/admin/sugestoes");

    fireEvent.click(await screen.findByRole("button", { name: /Marcar como atendida/ }));
    fireEvent.change(screen.getByLabelText("Buscar o post que atendeu a sugestão"), { target: { value: "post" } });

    fireEvent.click(await screen.findByRole("button", { name: /Post em rascunho/ }, { timeout: 2000 }));
    const show = screen.getByRole("checkbox", { name: /Vocês pediram, saiu/ });
    expect(show.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "trocar" }));
    fireEvent.change(screen.getByLabelText("Buscar o post que atendeu a sugestão"), { target: { value: "post" } });
    fireEvent.click(await screen.findByRole("button", { name: /Post no ar/ }, { timeout: 2000 }));
    const showLive = screen.getByRole("checkbox", { name: /Vocês pediram, saiu/ });
    expect(showLive.disabled).toBe(false);
    fireEvent.click(showLive);

    fireEvent.click(screen.getByRole("button", { name: "Salvar como atendida" }));
    await waitFor(() =>
      expect(SuggestionsService.update).toHaveBeenCalledWith("s1", {
        status: "done",
        post: "p1",
        publicText: suggestion.message,
        isPublic: true,
        notify: true,
      })
    );
  });

  it("abas com a contagem de cada status", async () => {
    SuggestionsService.adminList.mockResolvedValue({
      suggestions: [],
      total: 0,
      page: 1,
      totalPages: 1,
      counts: { new: 0, planned: 2, done: 5, archived: 1 },
    });
    renderAt(<AdminSuggestions />, "/admin/sugestoes");
    const tabs = await screen.findByRole("tablist");
    await waitFor(() => expect(within(tabs).getByRole("tab", { name: /Atendidas/ }).textContent).toContain("(5)"));
    expect(screen.getByText("Nenhuma sugestão nova.")).toBeTruthy();
  });
});
