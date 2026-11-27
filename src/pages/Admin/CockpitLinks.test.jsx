import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../hooks/useToast", () => ({ useToast: () => toast }));
vi.mock("../../services/cockpit.service", () => ({
  default: { listLinks: vi.fn(), createLink: vi.fn(), updateLink: vi.fn(), removeLink: vi.fn() },
}));

import CockpitService from "../../services/cockpit.service";
import CockpitLinks from "./CockpitLinks";

const links = [
  { _id: "1", label: "Google Ads", url: "https://ads.google.com/", group: "anuncios", note: "conta principal", order: 0 },
  { _id: "2", label: "GA4", url: "https://analytics.google.com/", group: "analytics", note: "", order: 0 },
];

const renderPage = async (list = links, findLabel = "Anúncios") => {
  CockpitService.listLinks.mockResolvedValue(list);
  render(<MemoryRouter><CockpitLinks /></MemoryRouter>);
  await screen.findByLabelText(findLabel);
};

describe("Cockpit: Links", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("agrupa e abre em nova aba com noopener noreferrer", async () => {
    await renderPage();
    const a = within(screen.getByLabelText("Anúncios")).getByRole("link", { name: /Google Ads/ });
    expect(a.getAttribute("href")).toBe("https://ads.google.com/");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByLabelText("Analytics")).toBeTruthy();
    expect(screen.queryByLabelText("Clientes")).toBeNull();
  });

  it("link com endereço inseguro vindo da API não vira href", async () => {
    await renderPage([{ _id: "9", label: "Ruim", url: "javascript:alert(1)", group: "outros" }], "Outros");
    expect(screen.getByText("Ruim").closest("a").getAttribute("href")).toBeNull();
  });

  it("recusa endereço que não é https antes de enviar", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Novo link/ }));
    const form = await screen.findByRole("form", { name: "Novo link" });
    fireEvent.change(within(form).getByLabelText("Nome"), { target: { value: "Teste" } });
    fireEvent.change(within(form).getByLabelText(/Endereço/), { target: { value: "http://teste.com" } });
    fireEvent.submit(form);
    expect(within(form).getByRole("alert").textContent).toMatch(/https:\/\//);
    expect(CockpitService.createLink).not.toHaveBeenCalled();

    fireEvent.change(within(form).getByLabelText(/Endereço/), { target: { value: "https://teste.com" } });
    CockpitService.createLink.mockResolvedValue({});
    fireEvent.submit(form);
    await waitFor(() => expect(CockpitService.createLink).toHaveBeenCalledWith(expect.objectContaining({ label: "Teste", url: "https://teste.com", group: "outros" })));
  });

  it("vazio mostra mensagem; erro da API vira alerta", async () => {
    CockpitService.listLinks.mockResolvedValue([]);
    render(<MemoryRouter><CockpitLinks /></MemoryRouter>);
    await screen.findByText(/Nenhum link ainda/);
    cleanup();
    CockpitService.listLinks.mockRejectedValue({ response: { data: { error: "Sessão inválida" } } });
    render(<MemoryRouter><CockpitLinks /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Sessão inválida"));
  });
});
