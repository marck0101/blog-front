import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../hooks/useToast", () => ({ useToast: () => toast }));
vi.mock("../../services/cockpit.service", () => ({
  default: { getAutomacoes: vi.fn(), getPlacar: vi.fn(), savePlacarMetas: vi.fn() },
}));

import CockpitService from "../../services/cockpit.service";
import CockpitAutomacoes from "./CockpitAutomacoes";
import CockpitPlacar from "./CockpitPlacar";
import { duration } from "../../utils/cockpit";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const run = (i, status = "ok") => ({ status, startedAt: new Date(Date.UTC(2026, 10, 27, 12, 0, i)).toISOString(), finishedAt: null, durationMs: 1500 + i, items: i, error: status === "fail" ? "timeout" : null });
const job = (over) => ({ job: "x", label: "Rotina X", status: "ok", expectedEverySec: 86400, graceSec: 3600, lastRunAt: new Date().toISOString(), neverRan: false, lastError: null, runs: [run(1)], ...over });

describe("Cockpit: Automações", () => {
  it("mostra status por texto e símbolo, últimas execuções e duração", async () => {
    CockpitService.getAutomacoes.mockResolvedValue({
      jobs: [
        job({ job: "a", label: "Rotina A", runs: Array.from({ length: 10 }, (_, i) => run(i)) }),
        job({ job: "b", label: "Rotina B", status: "falhou", lastError: "timeout", runs: [run(1, "fail")] }),
        job({ job: "c", label: "Rotina C", status: "atrasada", runs: [] }),
        job({ job: "d", label: "Rotina D", status: "nunca_rodou", neverRan: true, lastRunAt: null, runs: [] }),
      ],
    });
    render(<MemoryRouter><CockpitAutomacoes /></MemoryRouter>);
    const a = within(await screen.findByLabelText("Rotina A"));
    expect(a.getAllByText("OK").length).toBeGreaterThan(0); // status da rotina e das execuções
    expect(a.getAllByRole("row")).toHaveLength(11); // cabeçalho + 10
    expect(a.getAllByText("1,5 s").length).toBeGreaterThan(0);
    expect(within(screen.getByLabelText("Rotina B")).getByText("Falhou", { selector: "span" })).toBeTruthy();
    expect(within(screen.getByLabelText("Rotina C")).getByText("Atrasada")).toBeTruthy();
    expect(within(screen.getByLabelText("Rotina D")).getByText("Nunca rodou")).toBeTruthy();
    expect(within(screen.getByLabelText("Rotina D")).getByText(/Ainda não deu sinal/)).toBeTruthy();
  });

  it("não usa cores de semáforo", async () => {
    CockpitService.getAutomacoes.mockResolvedValue({ jobs: [job({ status: "falhou" }), job({ job: "y", status: "atrasada" })] });
    const { container } = render(<MemoryRouter><CockpitAutomacoes /></MemoryRouter>);
    await screen.findAllByLabelText("Rotina X");
    expect(container.innerHTML).not.toMatch(/(green|amber|red|yellow)-\d/);
  });

  it("formata duração", () => {
    expect(duration(400)).toBe("400 ms");
    expect(duration(90000)).toBe("1 min 30 s");
    expect(duration(null)).toBe("—");
  });
});

const serie = (value, status) => Array.from({ length: 13 }, (_, i) => ({ week: `2026-W${36 + i}`, start: "2026-11-23", end: "2026-11-29", current: i === 12, value, status }));
const placar = () => ({
  weeks: serie(0, "x"),
  numeros: [
    { key: "contatos_semana", label: "Contatos", unit: "n", meta: 20, current: { value: 12, status: "abaixo" }, previous: { value: 25 }, serie: serie(12, "abaixo") },
    { key: "receita_mes", label: "Receita do mês (R$)", unit: "brl", meta: null, current: { value: 4000, status: "sem_meta" }, previous: { value: null }, serie: serie(4000, "sem_meta") },
  ],
});

describe("Cockpit: Placar", () => {
  it("mostra números, situação em texto e as 13 semanas", async () => {
    CockpitService.getPlacar.mockResolvedValue(placar());
    render(<MemoryRouter><CockpitPlacar /></MemoryRouter>);
    const table = within((await screen.findByRole("table", { name: /Números da semana atual/ })));
    expect(table.getByText("Abaixo da meta")).toBeTruthy();
    expect(table.getByText("Sem meta")).toBeTruthy();
    expect(screen.getByLabelText("Meta semanal de Contatos").value).toBe("20");
    const details = screen.getByText("Contatos", { selector: "summary" }).closest("details");
    expect(within(details).getAllByRole("row")).toHaveLength(14);
  });

  it("salva só a meta alterada; campo vazio apaga; negativo bloqueia", async () => {
    CockpitService.getPlacar.mockResolvedValue(placar());
    CockpitService.savePlacarMetas.mockResolvedValue({});
    render(<MemoryRouter><CockpitPlacar /></MemoryRouter>);
    const field = await screen.findByLabelText("Meta semanal de Contatos");
    const button = screen.getByRole("button", { name: "Salvar metas" });
    expect(button.disabled).toBe(true);

    fireEvent.change(field, { target: { value: "-3" } });
    expect(screen.getByRole("alert").textContent).toMatch(/sem sinal de menos/);
    expect(button.disabled).toBe(true);

    fireEvent.change(field, { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Meta semanal de Receita do mês (R$)"), { target: { value: "2500,5" } });
    fireEvent.click(button);
    await waitFor(() => expect(CockpitService.savePlacarMetas).toHaveBeenCalledWith({ contatos_semana: null, receita_mes: 2500.5 }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Metas salvas", "success"));
  });
});
