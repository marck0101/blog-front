import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CookieBanner from ".";

// Lint zero: a decisão de mostrar saiu do useEffect (estado inicial calculado)
describe("CookieBanner", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const buttons = () => screen.queryAllByRole("button");

  it("aparece para quem ainda não respondeu", () => {
    render(<CookieBanner />);
    expect(buttons().length).toBeGreaterThan(0);
  });

  it("não aparece para quem já respondeu", () => {
    localStorage.setItem("cookiesAccepted", "all");
    render(<CookieBanner />);
    expect(buttons()).toHaveLength(0);
  });

  it("responder guarda a escolha, avisa as análises e some", () => {
    const consent = vi.fn();
    window.addEventListener("cookie-consent", consent);
    render(<CookieBanner />);
    fireEvent.click(buttons()[0]);
    expect(localStorage.getItem("cookiesAccepted")).toBeTruthy();
    expect(consent).toHaveBeenCalledOnce();
    expect(buttons()).toHaveLength(0);
    window.removeEventListener("cookie-consent", consent);
  });

  it("sem localStorage (navegação privada restrita): pergunta e não quebra ao responder", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    render(<CookieBanner />);
    expect(() => fireEvent.click(buttons()[0])).not.toThrow();
    expect(buttons()).toHaveLength(0);
  });
});
