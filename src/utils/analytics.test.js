import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsAllowed, CONSENT_KEY, isPrivatePath } from "./analytics";

// GA4, Clarity e Pixel nunca rodam onde há dado de assinante (SEC-03)
describe("isPrivatePath", () => {
  it.each(["/admin", "/admin/subscribers", "/cancelar-inscricao"])("%s não é medido", (path) => {
    expect(isPrivatePath(path)).toBe(true);
  });

  it.each(["/blog", "/blog/um-post", "/seasons", "/favoritos"])("%s é medido", (path) => {
    expect(isPrivatePath(path)).toBe(false);
  });
});

// T2 (LGPD): nada de GA4, Clarity ou Pixel antes do aceite explícito
describe("analyticsAllowed", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("sem resposta ao banner: não mede", () => {
    expect(analyticsAllowed()).toBe(false);
  });

  it("recusou: não mede", () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    expect(analyticsAllowed()).toBe(false);
  });

  it("aceitou: mede", () => {
    localStorage.setItem(CONSENT_KEY, "all");
    expect(analyticsAllowed()).toBe(true);
  });

  it("sem localStorage: não mede", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(analyticsAllowed()).toBe(false);
  });
});

// R5: evento antes do GA4 carregar (carregamento adiado) vai para a fila, só com aceite
describe("fila do GA4 antes do carregamento", () => {
  const setHost = (host) => vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, hostname: host, pathname: "/blog", search: "" });
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("sem aceite: não guarda", async () => {
    const { trackEvent, _pendingGA } = await import("./analytics");
    setHost("blog.marck0101.com.br");
    const before = _pendingGA().length;
    trackEvent("experiment_impression", { experiment_id: "x", variant_id: "a" });
    expect(_pendingGA().length).toBe(before);
  });

  it("com aceite, em produção: guarda para enviar quando o GA4 carregar", async () => {
    const { trackEvent, _pendingGA } = await import("./analytics");
    setHost("blog.marck0101.com.br");
    localStorage.setItem(CONSENT_KEY, "all");
    trackEvent("experiment_impression", { experiment_id: "x", variant_id: "a" });
    expect(_pendingGA()).toContainEqual(["experiment_impression", { experiment_id: "x", variant_id: "a" }]);
  });

  it("fora de produção: não guarda", async () => {
    const { trackEvent, _pendingGA } = await import("./analytics");
    setHost("localhost");
    localStorage.setItem(CONSENT_KEY, "all");
    const before = _pendingGA().length;
    trackEvent("x_event", {});
    expect(_pendingGA().length).toBe(before);
  });
});
