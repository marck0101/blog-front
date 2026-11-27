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
