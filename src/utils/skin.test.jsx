import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, cleanup, render, screen } from "@testing-library/react";
import { answerOffer, applySkin, getOfferAnswer, getSkin, setSkin, SKIN_CSS_HREF, SKIN_CSS_ID } from "./skin";
import TerminalOffer from "../components/TerminalOffer";

const root = document.documentElement;
const cssLinks = () => document.querySelectorAll(`#${SKIN_CSS_ID}`);
const has = (c) => root.classList.contains(c);

beforeEach(() => {
  localStorage.clear();
  root.className = "";
  cssLinks().forEach((el) => el.remove());
});

describe("estilos do blog", () => {
  it("começa no visual atual e sem baixar o CSS", () => {
    expect(getSkin()).toBe("atual");
    applySkin();
    expect(has("raiz")).toBe(false);
    expect(cssLinks()).toHaveLength(0);
  });

  it("Jornal: salva, põe as classes e baixa o CSS uma vez só", () => {
    setSkin("jornal");
    setSkin("jornal");
    expect(localStorage.getItem("skin")).toBe("jornal");
    expect(has("raiz") && has("jornal") && !has("terminal")).toBe(true);
    expect(cssLinks()).toHaveLength(1);
    expect(cssLinks()[0].getAttribute("href")).toBe(SKIN_CSS_HREF);
  });

  it("troca direto do Jornal para o Terminal e volta ao atual, sem recarregar", () => {
    setSkin("jornal");
    setSkin("terminal");
    expect(has("terminal") && !has("jornal")).toBe(true);
    setSkin("atual");
    expect(localStorage.getItem("skin")).toBeNull();
    expect(has("raiz") || has("jornal") || has("terminal")).toBe(false);
  });

  it("quem salvou \"raiz\" na fase 1 continua no Jornal", () => {
    localStorage.setItem("skin", "raiz");
    expect(getSkin()).toBe("jornal");
  });

  it("valor desconhecido vira o visual atual", () => {
    expect(setSkin("neon")).toBe("atual");
  });

  it("época ignora o tema escuro e devolve ao voltar para o atual", () => {
    localStorage.setItem("theme", "dark");
    root.classList.add("dark");
    setSkin("jornal");
    expect(has("dark")).toBe(false);
    expect(root.style.colorScheme).toBe("light");
    setSkin("terminal");
    expect(has("dark")).toBe(false); // o Terminal tem a própria paleta escura
    expect(root.style.colorScheme).toBe("dark");
    setSkin("atual");
    expect(has("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});

describe("convite do Terminal", () => {
  const techPost = () => render(<TerminalOffer category="tecnologia" />);

  beforeEach(() => localStorage.setItem("cookiesAccepted", "essential"));
  afterEach(cleanup);

  it("aparece em post de tecnologia para quem ainda não respondeu", () => {
    techPost();
    expect(screen.getByRole("complementary", { name: /modo terminal/i })).toBeTruthy();
  });

  it("não aparece em outra categoria", () => {
    render(<TerminalOffer category="marketing" />);
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("espera o banner de cookies ser respondido", () => {
    localStorage.removeItem("cookiesAccepted");
    techPost();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("Sim: liga o Terminal no blog todo e não pergunta mais", () => {
    techPost();
    act(() => screen.getByRole("button", { name: /sim/i }).click());
    expect(getSkin()).toBe("terminal");
    expect(getOfferAnswer()).toBe("aceito");
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("Não: fica no estilo de antes e não pergunta mais", () => {
    setSkin("jornal");
    techPost();
    act(() => screen.getByRole("button", { name: /agora não/i }).click());
    expect(getSkin()).toBe("jornal");
    expect(getOfferAnswer()).toBe("recusado");
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("quem respondeu antes não vê de novo", () => {
    answerOffer(false);
    techPost();
    expect(screen.queryByRole("complementary")).toBeNull();
  });
});

// public/theme-init.js roda antes de pintar; testado como o navegador o executa
describe("theme-init.js", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const script = readFileSync(join(here, "../../public/theme-init.js"), "utf8");
  const run = (path = "/blog/um-post") => {
    window.history.replaceState(null, "", path);
    new Function(script)();
  };

  beforeEach(() => {
    window.matchMedia = vi.fn(() => ({ matches: false }));
    vi.spyOn(document, "write").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("sem escolha salva, não liga nem baixa nada", () => {
    run();
    expect(has("raiz")).toBe(false);
    expect(document.write).not.toHaveBeenCalled();
  });

  it.each(["jornal", "terminal"])("com %s salvo, aplica antes de pintar e pede o CSS", (skin) => {
    localStorage.setItem("skin", skin);
    run();
    expect(has("raiz") && has(skin)).toBe(true);
    expect(document.write).toHaveBeenCalledWith(expect.stringContaining(`href="${SKIN_CSS_HREF}"`));
    expect(document.write).toHaveBeenCalledWith(expect.stringContaining(`id="${SKIN_CSS_ID}"`));
  });

  it("\"raiz\" da fase 1 abre no Jornal", () => {
    localStorage.setItem("skin", "raiz");
    run();
    expect(has("jornal")).toBe(true);
  });

  it("o painel não tem estilo de época", () => {
    localStorage.setItem("skin", "terminal");
    run("/admin/posts");
    expect(has("raiz")).toBe(false);
    expect(document.write).not.toHaveBeenCalled();
  });

  it("estilos desligados no painel: abre no visual atual mesmo com escolha salva", () => {
    localStorage.setItem("skin", "terminal");
    localStorage.setItem("site-features", JSON.stringify({ skins: false }));
    run();
    expect(has("raiz")).toBe(false);
    expect(document.write).not.toHaveBeenCalled();
  });

  it("Jornal com tema escuro salvo abre claro (fiel à época)", () => {
    localStorage.setItem("skin", "jornal");
    localStorage.setItem("theme", "dark");
    run();
    expect(has("jornal")).toBe(true);
    expect(has("dark")).toBe(false);
    expect(root.style.colorScheme).toBe("light");
  });

  it("visual atual continua seguindo o tema", () => {
    localStorage.setItem("theme", "dark");
    run();
    expect(has("dark")).toBe(true);
  });
});
