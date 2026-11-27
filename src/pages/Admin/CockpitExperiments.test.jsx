import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../hooks/useToast", () => ({ useToast: () => toast }));
vi.mock("../../services/cockpit.service", () => ({
  default: {
    listExperiments: vi.fn(),
    createExperiment: vi.fn(),
    updateExperiment: vi.fn(),
    transitionExperiment: vi.fn(),
    removeExperiment: vi.fn(),
  },
}));

import CockpitService from "../../services/cockpit.service";
import CockpitExperiments from "./CockpitExperiments";

const DAY = 86_400_000;
const exp = (over = {}) => ({
  _id: "e1",
  title: "Título com número",
  hypothesis: "Se tiver número, então clica mais, porque é concreto",
  area: "conteudo",
  channel: "Blog",
  metric: "CTR",
  ice: { impact: 4, confidence: 3, ease: 5 },
  iceScore: 60,
  status: "ideia",
  variants: [{ name: "A" }, { name: "B" }],
  result: {},
  createdAt: "2026-11-01T00:00:00Z",
  ...over,
});

const renderPage = async (list) => {
  CockpitService.listExperiments.mockResolvedValue(list);
  render(<MemoryRouter><CockpitExperiments /></MemoryRouter>);
  await screen.findByLabelText("Ideia");
};

describe("Cockpit: Experimentos", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("agrupa em colunas por status e ordena 'ideia' pelo ICE", async () => {
    await renderPage([
      exp({ _id: "a", title: "Baixo", iceScore: 8 }),
      exp({ _id: "b", title: "Alto", iceScore: 100 }),
      exp({ _id: "c", title: "Em andamento", status: "rodando", plannedEnd: new Date(Date.now() + 3 * DAY).toISOString() }),
    ]);
    const titles = within(screen.getByLabelText("Ideia")).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["Alto", "Baixo"]);
    expect(within(screen.getByLabelText("Rodando")).getByText("Em andamento")).toBeTruthy();
    expect(within(screen.getByLabelText("Concluído")).getByText("Nenhum experimento aqui.")).toBeTruthy();
  });

  it("rodando mostra dias restantes e amostra mínima", async () => {
    await renderPage([exp({ status: "rodando", minSample: 1000, plannedEnd: new Date(Date.now() + 3 * DAY).toISOString() })]);
    const card = within(screen.getByLabelText("Rodando"));
    expect(card.getByText(/faltam [34] dias/)).toBeTruthy();
    expect(card.getByText(/amostra mínima 1\.000/)).toBeTruthy();
  });

  it("concluído mostra decisão e aprendizado", async () => {
    await renderPage([exp({ status: "concluido", result: { summary: "B ganhou", decision: "adotar", learning: "Número funciona" } })]);
    const col = within(screen.getByLabelText("Concluído"));
    expect(col.getByText("Decisão: Adotar")).toBeTruthy();
    expect(col.getByText(/Número funciona/)).toBeTruthy();
  });

  it("mover por botão chama a transição; erro da API vira aviso", async () => {
    await renderPage([exp()]);
    CockpitService.transitionExperiment.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Planejar: Título com número" }));
    await waitFor(() => expect(CockpitService.transitionExperiment).toHaveBeenCalledWith("e1", "planejado"));

    CockpitService.transitionExperiment.mockRejectedValueOnce({ response: { data: { error: "Não dá para ir de ideia para x" } } });
    fireEvent.click(screen.getByRole("button", { name: "Descartar: Título com número" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Não dá para ir de ideia para x", "error"));
  });

  it("só oferece as transições permitidas", async () => {
    await renderPage([exp({ status: "ideia" })]);
    expect(screen.queryByRole("button", { name: /^Rodar:/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Concluir:/ })).toBeNull();
  });

  it("concluir abre o resultado e exige resumo, decisão e aprendizado", async () => {
    await renderPage([exp({ status: "analisando" })]);
    fireEvent.click(screen.getByRole("button", { name: "Concluir: Título com número" }));
    const form = await screen.findByRole("form", { name: /Resultado de/ });
    fireEvent.click(within(form).getByRole("button", { name: "Concluir experimento" }));
    expect(within(form).getByRole("alert").textContent).toMatch(/resumo, a decisão e o aprendizado/);
    expect(CockpitService.transitionExperiment).not.toHaveBeenCalled();

    fireEvent.change(within(form).getByLabelText("Resumo do resultado"), { target: { value: "B ganhou" } });
    fireEvent.change(within(form).getByLabelText("Decisão"), { target: { value: "adotar" } });
    fireEvent.change(within(form).getByLabelText(/Aprendizado/), { target: { value: "Número funciona" } });
    CockpitService.transitionExperiment.mockResolvedValue({});
    fireEvent.click(within(form).getByRole("button", { name: "Concluir experimento" }));
    await waitFor(() =>
      expect(CockpitService.transitionExperiment).toHaveBeenCalledWith("e1", "concluido", expect.objectContaining({ summary: "B ganhou", decision: "adotar", learning: "Número funciona" }))
    );
  });

  it("formulário: sliders ICE calculam a nota e a hipótese precisa de Se/então/porque", async () => {
    await renderPage([]);
    fireEvent.click(screen.getByRole("button", { name: /Novo experimento/ }));
    const form = await screen.findByRole("form", { name: "Novo experimento" });
    fireEvent.change(within(form).getByRole("slider", { name: /^Impacto/ }), { target: { value: "5" } });
    fireEvent.change(within(form).getByRole("slider", { name: /^Confiança/ }), { target: { value: "4" } });
    fireEvent.change(within(form).getByRole("slider", { name: /^Facilidade/ }), { target: { value: "2" } });
    expect(within(form).getByText("40")).toBeTruthy();

    fireEvent.change(within(form).getByLabelText("Título"), { target: { value: "Novo teste" } });
    fireEvent.change(within(form).getByLabelText(/^Hipótese/), { target: { value: "só uma ideia solta" } });
    fireEvent.click(within(form).getByRole("button", { name: "Criar experimento" }));
    expect(within(form).getByRole("alert").textContent).toMatch(/Se … então … porque/);
    expect(CockpitService.createExperiment).not.toHaveBeenCalled();

    fireEvent.change(within(form).getByLabelText(/^Hipótese/), { target: { value: "Se mudar, então melhora, porque sim" } });
    CockpitService.createExperiment.mockResolvedValue({});
    fireEvent.click(within(form).getByRole("button", { name: "Criar experimento" }));
    await waitFor(() => expect(CockpitService.createExperiment).toHaveBeenCalled());
    expect(CockpitService.createExperiment.mock.calls[0][0].ice).toEqual({ impact: 5, confidence: 4, ease: 2 });
  });

  it("erro ao carregar vira alerta", async () => {
    CockpitService.listExperiments.mockRejectedValue({ response: { data: { error: "Sessão inválida" } } });
    render(<MemoryRouter><CockpitExperiments /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Sessão inválida"));
  });
});
