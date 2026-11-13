import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applySkin, getSkinPref, setSkinPref, SKIN_CSS_HREF, SKIN_CSS_ID } from "./skin";

const root = document.documentElement;
const cssLinks = () => document.querySelectorAll(`#${SKIN_CSS_ID}`);

beforeEach(() => {
  localStorage.clear();
  root.className = "";
  cssLinks().forEach((el) => el.remove());
});

describe("modo raiz", () => {
  it("começa desligado e sem baixar o CSS", () => {
    expect(getSkinPref()).toBe(false);
    applySkin();
    expect(root.classList.contains("raiz")).toBe(false);
    expect(cssLinks()).toHaveLength(0);
  });

  it("ligar salva a escolha, põe a classe e baixa o CSS uma vez só", () => {
    setSkinPref(true);
    setSkinPref(true);
    expect(localStorage.getItem("skin")).toBe("raiz");
    expect(root.classList.contains("raiz")).toBe(true);
    expect(cssLinks()).toHaveLength(1);
    expect(cssLinks()[0].getAttribute("href")).toBe(SKIN_CSS_HREF);
  });

  it("desligar tira a classe e apaga a escolha, sem recarregar", () => {
    setSkinPref(true);
    setSkinPref(false);
    expect(localStorage.getItem("skin")).toBeNull();
    expect(root.classList.contains("raiz")).toBe(false);
  });

  it("não mexe no tema claro/escuro", () => {
    root.classList.add("dark");
    setSkinPref(true);
    setSkinPref(false);
    expect(root.classList.contains("dark")).toBe(true);
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
    expect(root.classList.contains("raiz")).toBe(false);
    expect(document.write).not.toHaveBeenCalled();
  });

  it("com o modo raiz salvo, liga antes de pintar e pede o CSS", () => {
    localStorage.setItem("skin", "raiz");
    run();
    expect(root.classList.contains("raiz")).toBe(true);
    expect(document.write).toHaveBeenCalledWith(expect.stringContaining(`href="${SKIN_CSS_HREF}"`));
    expect(document.write).toHaveBeenCalledWith(expect.stringContaining(`id="${SKIN_CSS_ID}"`));
  });

  it("o painel não tem modo raiz", () => {
    localStorage.setItem("skin", "raiz");
    run("/admin/posts");
    expect(root.classList.contains("raiz")).toBe(false);
    expect(document.write).not.toHaveBeenCalled();
  });

  it("raiz e escuro juntos (Terminal)", () => {
    localStorage.setItem("skin", "raiz");
    localStorage.setItem("theme", "dark");
    run();
    expect(root.classList.contains("raiz")).toBe(true);
    expect(root.classList.contains("dark")).toBe(true);
  });
});
