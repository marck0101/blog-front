import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FEATURE_DEFAULTS, getFeatures, isFeatureOn, saveFeatures } from "./features";
import { getSkin, setSkin } from "./skin";
import SkinToggle from "../components/SkinToggle";
import TerminalOffer from "../components/TerminalOffer";

vi.mock("../services/settings.service", () => ({
  default: {
    getFeatures: vi.fn(async () => ({ features: { skins: true, terminalOffer: true, toc: true, readingProgress: true }, updatedAt: null })),
    setFeature: vi.fn(async (name, on) => ({
      features: { skins: true, terminalOffer: true, toc: true, readingProgress: true, [name]: on },
      updatedAt: "2026-11-13T18:00:00Z",
    })),
  },
}));
vi.mock("../hooks/useToast", () => ({ useToast: () => vi.fn() }));
vi.mock("../components/Header", () => ({ default: () => null }));

import SettingsService from "../services/settings.service";
import Features from "../pages/Admin/Features";

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("cookiesAccepted", "essential");
  root.className = "";
  window.history.replaceState(null, "", "/blog/um-post");
});
afterEach(cleanup);

describe("recursos do blog (leitor)", () => {
  it("sem resposta da API, tudo ligado", () => {
    expect(getFeatures()).toEqual(FEATURE_DEFAULTS);
  });

  it("guarda só os nomes conhecidos, só true/false", () => {
    act(() => saveFeatures({ toc: false, skins: "nao", hack: true }));
    expect(getFeatures()).toEqual({ ...FEATURE_DEFAULTS, toc: false });
    expect(isFeatureOn("toc")).toBe(false);
  });

  it("valor estragado no navegador volta ao padrão", () => {
    localStorage.setItem("site-features", "{oops");
    expect(getFeatures()).toEqual(FEATURE_DEFAULTS);
  });

  it("desligar os estilos tira o Terminal da página aberta e religar devolve", () => {
    setSkin("terminal");
    expect(root.classList.contains("terminal")).toBe(true);

    act(() => saveFeatures({ skins: false }));
    expect(getSkin()).toBe("atual");
    expect(root.classList.contains("raiz")).toBe(false);
    expect(localStorage.getItem("skin")).toBe("terminal"); // escolha do leitor fica

    act(() => saveFeatures({ skins: true }));
    expect(root.classList.contains("terminal")).toBe(true);
  });

  it("seletor de estilo some com os estilos desligados", () => {
    const { container } = render(<SkinToggle />);
    expect(screen.getByTitle("Estilo do blog")).toBeTruthy();
    act(() => saveFeatures({ skins: false }));
    expect(container.innerHTML).toBe("");
  });

  it("convite do Terminal some se ele ou os estilos estiverem desligados", () => {
    const { container } = render(<TerminalOffer category="tecnologia" />);
    expect(screen.getByRole("complementary", { name: "Convite para o modo terminal" })).toBeTruthy();
    act(() => saveFeatures({ terminalOffer: false }));
    expect(container.innerHTML).toBe("");
    act(() => saveFeatures({ skins: false }));
    expect(container.innerHTML).toBe("");
  });
});

describe("página Recursos do blog (painel)", () => {
  it("um clique desliga o recurso", async () => {
    render(<MemoryRouter><Features /></MemoryRouter>);
    const toc = await screen.findByRole("switch", { name: "Sumário do post" });
    expect(toc.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(toc);
    expect(SettingsService.setFeature).toHaveBeenCalledWith("toc", false);
    await waitFor(() => expect(toc.getAttribute("aria-checked")).toBe("false"));
  });

  it("erro ao salvar desfaz o clique", async () => {
    SettingsService.setFeature.mockRejectedValueOnce(new Error("rede"));
    render(<MemoryRouter><Features /></MemoryRouter>);
    const bar = await screen.findByRole("switch", { name: "Barra de leitura" });
    fireEvent.click(bar);
    await waitFor(() => expect(bar.getAttribute("aria-checked")).toBe("true"));
  });
});
