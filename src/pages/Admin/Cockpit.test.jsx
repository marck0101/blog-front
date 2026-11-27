import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../components/Header", () => ({ default: () => null }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../services/cockpit.service", () => ({ default: { getHoje: vi.fn() } }));

import CockpitService from "../../services/cockpit.service";
import Cockpit from "./Cockpit";

const ago = (ms) => new Date(Date.now() - ms).toISOString();
const tile = (source, ms = 60_000, staleAfterSec = 172_800) => ({ source, updatedAt: ago(ms), staleAfterSec });

const hoje = (over = {}) => ({
  receita: { ...tile("prospect0101", 5 * 60_000), meta: 15000, accumulated: 7000, expected: 7500, pctOfExpected: 93.3, projection: 14000, status: "atencao" },
  prospeccao: { ...tile("prospect0101", 3_600_000), contatos: 30, respostas: 6, reunioes: 2, hasData: true },
  leituras: { ...tile("blog"), staleAfterSec: null, views7d: 120, viewsPrev7d: 100, variacaoPct: 20 },
  inscritos: { ...tile("blog"), staleAfterSec: null, ativos: 42, novosMes: 5 },
  automacoes: {
    ...tile("cockpit"),
    staleAfterSec: null,
    ok: 1,
    rodando: 0,
    atrasada: 1,
    falhou: 1,
    jobs: [
      { job: "blog-cron-daily", label: "Rotina diária do blog", status: "ok", lastRunAt: ago(3_600_000), neverRan: false },
      { job: "prospect-worker", label: "Prospecção (worker)", status: "atrasada", lastRunAt: null, neverRan: true },
      { job: "reports-bot", label: "Relatórios (bot)", status: "falhou", lastRunAt: ago(60_000), neverRan: false },
    ],
  },
  acoes: { ...tile("cockpit"), staleAfterSec: null, items: [{ id: "job-reports-bot", title: "Relatórios (bot) falhou", detail: "timeout" }] },
  ...over,
});

const renderPage = async (data) => {
  CockpitService.getHoje.mockResolvedValue(data);
  render(<MemoryRouter initialEntries={["/admin/cockpit"]}><Cockpit /></MemoryRouter>);
  await screen.findByLabelText("Receita do mês");
};

describe("Cockpit: página Hoje", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mostra os 6 tiles com os números da API", async () => {
    await renderPage(hoje());
    for (const name of ["Receita do mês", "Prospecção da semana", "Leituras do blog (7 dias)", "Inscritos", "Automações", "Precisa de ação"]) {
      expect(screen.getByLabelText(name)).toBeTruthy();
    }
    const receita = within(screen.getByLabelText("Receita do mês"));
    expect(receita.getByText(/7\.000/)).toBeTruthy();
    expect(receita.getByText("93,3%")).toBeTruthy();
    expect(within(screen.getByLabelText("Prospecção da semana")).getByText("30")).toBeTruthy();
    expect(within(screen.getByLabelText("Inscritos")).getByText("42")).toBeTruthy();
    expect(within(screen.getByLabelText("Leituras do blog (7 dias)")).getByText(/20% a mais/)).toBeTruthy();
  });

  it("status em texto e símbolo, não só cor", async () => {
    await renderPage(hoje());
    const receita = screen.getByLabelText("Receita do mês");
    expect(receita.textContent).toContain("▲");
    expect(within(receita).getByText("Atenção")).toBeTruthy();
    const auto = within(screen.getByLabelText("Automações"));
    expect(auto.getByText("Atrasada")).toBeTruthy();
    expect(auto.getByText("Falhou")).toBeTruthy();
    expect(auto.getByText("OK")).toBeTruthy();
    expect(auto.getByText("sem sinal ainda")).toBeTruthy();
  });

  it("cada tile diz a fonte e há quanto tempo atualizou", async () => {
    await renderPage(hoje());
    expect(within(screen.getByLabelText("Receita do mês")).getByText("prospect0101 · atualizado há 5 min")).toBeTruthy();
    expect(within(screen.getByLabelText("Inscritos")).getByText(/blog · atualizado/)).toBeTruthy();
  });

  it("sem retrato: 'sem dados' em receita e prospecção", async () => {
    await renderPage(
      hoje({
        receita: { source: "prospect0101", updatedAt: null, staleAfterSec: 172_800, meta: 15000, accumulated: null, expected: 7500, pctOfExpected: null, projection: null, status: "sem_dados" },
        prospeccao: { source: "prospect0101", updatedAt: null, staleAfterSec: 172_800, contatos: null, respostas: null, reunioes: null, hasData: false },
      })
    );
    const receita = within(screen.getByLabelText("Receita do mês"));
    expect(receita.getAllByText(/Sem dados/).length).toBeGreaterThan(0);
    expect(receita.getByText(/prospect0101 · sem atualização/)).toBeTruthy();
    expect(within(screen.getByLabelText("Prospecção da semana")).getByText("Sem dados de prospecção")).toBeTruthy();
  });

  it("retrato com mais de 2x o esperado fica acinzentado e avisa", async () => {
    await renderPage(hoje({ prospeccao: { ...tile("prospect0101", 3 * 86_400_000), contatos: 1, respostas: 1, reunioes: 1, hasData: true } }));
    const stale = screen.getByLabelText("Prospecção da semana");
    expect(stale.getAttribute("data-stale")).toBe("true");
    expect(stale.textContent).toContain("desatualizado");
    expect(screen.getByLabelText("Receita do mês").getAttribute("data-stale")).toBeNull();
  });

  it("precisa de ação lista os itens; vazio mostra 'Nada pendente'", async () => {
    await renderPage(hoje());
    expect(within(screen.getByLabelText("Precisa de ação")).getByText(/Relatórios \(bot\) falhou/)).toBeTruthy();
    cleanup();
    await renderPage(hoje({ acoes: { ...tile("cockpit"), staleAfterSec: null, items: [] } }));
    expect(within(screen.getByLabelText("Precisa de ação")).getByText(/Nada pendente/)).toBeTruthy();
  });

  it("sub-navegação Hoje | Experimentos | Links, com a aba atual marcada", async () => {
    await renderPage(hoje());
    const nav = within(screen.getByRole("navigation", { name: "Cockpit" }));
    expect(nav.getByText("Hoje").getAttribute("aria-current")).toBe("page");
    expect(nav.getByText("Experimentos").getAttribute("href")).toBe("/admin/cockpit/experimentos");
    expect(nav.getByText("Links").getAttribute("href")).toBe("/admin/cockpit/links");
  });

  it("experimentos vencidos aparecem em precisa de ação com link para o quadro", async () => {
    await renderPage(
      hoje({ acoes: { ...tile("cockpit"), staleAfterSec: null, items: [{ id: "experimentos-vencidos", title: "Experimentos rodando: 2 passou do prazo", detail: "Título A, Título B", count: 2 }] } })
    );
    const acoes = within(screen.getByLabelText("Precisa de ação"));
    expect(acoes.getByText(/Experimentos rodando: 2/)).toBeTruthy();
    expect(acoes.getByText("Ver experimentos").getAttribute("href")).toBe("/admin/cockpit/experimentos");
  });

  it("erro da API aparece como alerta", async () => {
    CockpitService.getHoje.mockRejectedValue({ response: { data: { error: "Sessão inválida" } } });
    render(<MemoryRouter initialEntries={["/admin/cockpit"]}><Cockpit /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });
});
