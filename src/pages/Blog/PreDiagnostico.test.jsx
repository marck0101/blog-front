import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../layouts/BlogLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../utils/analytics", () => ({ trackEvent: vi.fn() }));

import { trackEvent } from "../../utils/analytics";
import PreDiagnostico from "./PreDiagnostico";
import PreDiagnosticoCard from "../../components/PreDiagnosticoCard";
import { PRE_MESSAGE } from "../../seo/preDiagnostico";
import { HelmetProvider } from "react-helmet-async";

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <PreDiagnostico />
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, "", "/pre-diagnostico?utm_source=linkedin&foo=bar");
});
// jsdom não navega: evita o ruído "Not implemented: navigation" nos cliques em links
const blockNavigation = (e) => e.preventDefault();
beforeEach(() => document.addEventListener("click", blockNavigation));
afterEach(() => {
  document.removeEventListener("click", blockNavigation);
  cleanup();
});

describe("PreDiagnostico", () => {
  it("mostra o H1 e a FAQ", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Seu site e seu Google estão trazendo cliente ou só existindo?" }),
    ).toBeTruthy();
    expect(screen.getByText("Quanto custa o pré-diagnóstico?")).toBeTruthy();
  });

  it("WhatsApp leva o texto pronto codificado", () => {
    renderPage();
    const link = screen.getAllByRole("link", { name: /WhatsApp/ })[0];
    const href = link.getAttribute("href");
    expect(href.startsWith("https://wa.me/5555963370494?text=")).toBe(true);
    expect(href).toContain(encodeURIComponent(PRE_MESSAGE));
  });

  it("clique no WhatsApp dispara o evento do CTA, a conversão e mantém as UTMs", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("link", { name: /WhatsApp/ })[0]);
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_cta", {
      method: "whatsapp",
      link_location: "hero",
      utm_source: "linkedin",
    });
    expect(trackEvent).toHaveBeenCalledWith(
      "contact",
      { method: "whatsapp", link_location: "hero", utm_source: "linkedin" },
      { pixel: "Contact" },
    );
  });

  it("clique no e-mail dispara o evento com method email", () => {
    renderPage();
    const mail = screen.getAllByRole("link", { name: /e-mail/ })[1];
    expect(mail.getAttribute("href").startsWith("mailto:")).toBe(true);
    fireEvent.click(mail);
    expect(trackEvent).toHaveBeenCalledWith(
      "pre_diagnostico_cta",
      expect.objectContaining({ method: "email", link_location: "bottom" }),
    );
  });
});

describe("PreDiagnosticoCard", () => {
  it("leva a /pre-diagnostico e registra o clique", () => {
    render(
      <MemoryRouter>
        <PreDiagnosticoCard location="post" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Quero o meu/ });
    expect(link.getAttribute("href")).toBe("/pre-diagnostico");
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_card_click", { link_location: "post" });
  });
});
