import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/analytics", async (importOriginal) => ({ ...(await importOriginal()), trackEvent: vi.fn() }));
vi.mock("../services/experiments.service", () => ({ default: { getAtivos: vi.fn() } }));

import ExperimentsService from "../services/experiments.service";
import { CONSENT_EVENT, CONSENT_KEY, trackEvent } from "../utils/analytics";
import PreDiagnosticoCard from "../components/PreDiagnosticoCard";

const ATIVO = {
  chave: "cta-diagnostico",
  alvo: "pre-diagnostico-cta",
  variantes: [
    { chave: "controle", texto: "Quero o meu" },
    { chave: "curto", texto: "Descobrir meu cenário" },
  ],
};
const STORAGE = "exp:cta-diagnostico";

const renderCard = () =>
  render(
    <MemoryRouter>
      <PreDiagnosticoCard location="post" />
    </MemoryRouter>,
  );
const botao = () => screen.getByRole("link", { name: /Quero o meu|Descobrir meu cenário/ });
const responder = (valor) => {
  act(() => {
    localStorage.setItem(CONSENT_KEY, valor);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  });
};

let pagina = 0;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // cada teste numa página nova: a impressão é contada uma vez por página
  window.history.pushState({}, "", `/pagina-${++pagina}`);
  ExperimentsService.getAtivos.mockResolvedValue([ATIVO]);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useExperiment no pré-diagnóstico", () => {
  it("sem consentimento: texto padrão, nada gravado e nenhum evento", async () => {
    const gravar = vi.spyOn(Storage.prototype, "setItem");
    renderCard();
    await waitFor(() => expect(ExperimentsService.getAtivos).toHaveBeenCalled());
    await act(async () => {});
    expect(botao().textContent).toBe("Quero o meu");
    expect(gravar).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("consentimento essencial também não sorteia", async () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    renderCard();
    await act(async () => {});
    expect(localStorage.getItem(STORAGE)).toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("com consentimento: sorteia, guarda a escolha e manda a impressão com os parâmetros", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    vi.spyOn(Math, "random").mockReturnValue(0.9); // última variante
    renderCard();
    await waitFor(() => expect(botao().textContent).toBe("Descobrir meu cenário"));
    expect(localStorage.getItem(STORAGE)).toBe("curto");
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("experiment_impression", { experiment_id: "cta-diagnostico", variant_id: "curto" });
  });

  it("o clique leva experiment_id e variant_id", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderCard();
    await waitFor(() => expect(trackEvent).toHaveBeenCalled());
    const link = botao();
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_card_click", {
      link_location: "post",
      experiment_id: "cta-diagnostico",
      variant_id: "controle",
    });
  });

  it("a escolha é estável: visitante que volta vê a mesma variante, sem novo sorteio", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    localStorage.setItem(STORAGE, "curto");
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    renderCard();
    await waitFor(() => expect(botao().textContent).toBe("Descobrir meu cenário"));
    expect(random).not.toHaveBeenCalled();
  });

  it("escolha guardada de variante que não existe mais é sorteada de novo", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    localStorage.setItem(STORAGE, "removida");
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderCard();
    await waitFor(() => expect(localStorage.getItem(STORAGE)).toBe("controle"));
  });

  it("duas instâncias na mesma página mandam uma impressão só", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    render(
      <MemoryRouter>
        <PreDiagnosticoCard />
        <PreDiagnosticoCard />
      </MemoryRouter>,
    );
    await waitFor(() => expect(trackEvent).toHaveBeenCalled());
    await act(async () => {});
    expect(trackEvent.mock.calls.filter(([n]) => n === "experiment_impression")).toHaveLength(1);
  });

  it("aceitar depois de abrir a página: começa no padrão e passa a sortear", async () => {
    renderCard();
    await act(async () => {});
    expect(botao().textContent).toBe("Quero o meu");
    expect(localStorage.length).toBe(0);
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    responder("all");
    await waitFor(() => expect(botao().textContent).toBe("Descobrir meu cenário"));
    expect(trackEvent).toHaveBeenCalledWith("experiment_impression", { experiment_id: "cta-diagnostico", variant_id: "curto" });
  });

  it("revogar o consentimento volta ao padrão, apaga a escolha e não envia mais evento", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    renderCard();
    await waitFor(() => expect(botao().textContent).toBe("Descobrir meu cenário"));
    trackEvent.mockClear();
    responder("essential");
    await waitFor(() => expect(botao().textContent).toBe("Quero o meu"));
    expect(localStorage.getItem(STORAGE)).toBeNull();
    const link = botao();
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledTimes(1); // só o clique de sempre, sem parâmetros do experimento
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_card_click", { link_location: "post" });
  });

  it("API fora do ar: texto padrão e nada gravado, mesmo com consentimento", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    ExperimentsService.getAtivos.mockRejectedValue(new Error("rede"));
    renderCard();
    await act(async () => {});
    expect(botao().textContent).toBe("Quero o meu");
    expect(localStorage.getItem(STORAGE)).toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("sem experimento rodando para o espaço: texto padrão", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    ExperimentsService.getAtivos.mockResolvedValue([{ ...ATIVO, alvo: "outro-espaco" }]);
    renderCard();
    await act(async () => {});
    expect(botao().textContent).toBe("Quero o meu");
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
