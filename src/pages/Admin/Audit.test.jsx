import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../components/DateRangePicker", () => ({
  default: ({ onChange }) => <button type="button" onClick={() => onChange("2026-11-01", "2026-11-15")}>Período</button>,
}));
vi.mock("../../services/audit.service", () => ({ default: { list: vi.fn() } }));

import AuditService from "../../services/audit.service";
import Audit from "./Audit";

const entries = [
  {
    _id: "1",
    action: "post.publish",
    actor: { userId: "u1", email: "admin@exemplo.com" },
    target: { type: "post", id: "p1", label: "meu-post" },
    at: "2026-11-28T02:30:00.000Z", // 27/11 23:30 em Brasília
    meta: {},
  },
  {
    _id: "2",
    action: "campaign.send",
    actor: { userId: "u1", email: "admin@exemplo.com" },
    target: { type: "campaign", id: "c1", label: "Novidade de novembro" },
    at: "2026-11-27T12:00:00.000Z",
    meta: { audienceSize: 120 },
  },
  {
    _id: "3",
    action: "auth.login_failure",
    actor: { userId: null, email: null },
    target: { type: "auth", id: null, label: null },
    at: "2026-11-26T12:00:00.000Z",
    meta: { method: "password", reason: "credenciais" },
  },
  {
    _id: "4",
    action: "post.trash",
    actor: { userId: "u1", email: "admin@exemplo.com" },
    target: { type: "post", id: "p2", label: "post-na-lixeira" },
    at: "2026-11-25T12:00:00.000Z",
    meta: {},
  },
];

const reply = (over = {}) => ({ entries, total: 4, page: 1, totalPages: 1, ...over });

const renderPage = async (data = reply()) => {
  AuditService.list.mockResolvedValue(data);
  render(<MemoryRouter><Audit /></MemoryRouter>);
  await waitFor(() => expect(AuditService.list).toHaveBeenCalled());
};

const lastCall = () => AuditService.list.mock.calls.at(-1)[0];

describe("Admin: Auditoria", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mostra as entradas com ação em português, data de Brasília, quem e alvo", async () => {
    await renderPage();
    expect((await screen.findAllByText("Post publicado")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Envio disparado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Falha de login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("27/11/2026 23:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin@exemplo.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("público: 120").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ninguém identificado").length).toBeGreaterThan(0);
    expect(screen.getByText("4 registro(s)")).toBeTruthy();
  });

  it("liga o slug ao post; quem foi para a lixeira ou não é slug fica sem link", async () => {
    await renderPage();
    const links = await screen.findAllByRole("link", { name: "meu-post" });
    expect(links[0].getAttribute("href")).toBe("/blog/meu-post");
    expect(screen.queryByRole("link", { name: "post-na-lixeira" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Novidade de novembro" })).toBeNull();
  });

  it("pede a primeira página com 20 itens e sem filtros vazios", async () => {
    await renderPage();
    expect(lastCall()).toEqual({ page: 1, limit: 20, action: "", from: "", to: "" });
  });

  it("filtros de ação e período mudam a consulta e voltam para a página 1", async () => {
    await renderPage(reply({ page: 1, totalPages: 3 }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(lastCall().page).toBe(2));

    fireEvent.change(screen.getByLabelText("Filtrar por ação"), { target: { value: "post.trash" } });
    await waitFor(() => expect(lastCall()).toMatchObject({ page: 1, action: "post.trash" }));

    fireEvent.click(screen.getByRole("button", { name: "Período" }));
    await waitFor(() => expect(lastCall()).toMatchObject({ action: "post.trash", from: "2026-11-01", to: "2026-11-15" }));

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(lastCall()).toEqual({ page: 1, limit: 20, action: "", from: "", to: "" }));
  });

  it("pagina", async () => {
    await renderPage(reply({ total: 45, totalPages: 3 }));
    expect(await screen.findByText("Página 1 de 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(lastCall().page).toBe(2));
  });

  it("estado vazio sem filtro", async () => {
    await renderPage(reply({ entries: [], total: 0 }));
    expect(await screen.findByText("Nenhuma ação registrada ainda")).toBeTruthy();
  });

  it("estado vazio com filtro oferece limpar", async () => {
    await renderPage();
    await screen.findAllByText("Post publicado");
    AuditService.list.mockResolvedValue(reply({ entries: [], total: 0 }));
    fireEvent.change(screen.getByLabelText("Filtrar por ação"), { target: { value: "season.delete" } });
    expect(await screen.findByText("Nada neste filtro")).toBeTruthy();
  });

  it("erro mostra o aviso e tenta de novo", async () => {
    AuditService.list.mockRejectedValueOnce({ response: { data: { error: "Sessão expirada" } } });
    render(<MemoryRouter><Audit /></MemoryRouter>);
    expect((await screen.findByRole("alert")).textContent).toContain("Sessão expirada");

    AuditService.list.mockResolvedValue(reply());
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect((await screen.findAllByText("Post publicado")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
