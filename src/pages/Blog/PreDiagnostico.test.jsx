import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../layouts/BlogLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../components/SEO", () => ({ default: () => null }));
vi.mock("../../utils/analytics", async (importOriginal) => ({ ...(await importOriginal()), trackEvent: vi.fn() }));
vi.mock("../../services/experiments.service", () => ({ default: { getAtivos: vi.fn().mockResolvedValue([]) } }));

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

describe("PreDiagnostico com origem (R4)", () => {
  const renderFrom = (de) => {
    window.history.pushState({}, "", `/pre-diagnostico?de=${de}`);
    return render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[`/pre-diagnostico?de=${de}`]}>
          <PreDiagnostico />
        </MemoryRouter>
      </HelmetProvider>,
    );
  };
  const text = (href) => decodeURIComponent(href.split("text=")[1]);

  it("WhatsApp termina com [ref: blog-<slug>] e o evento leva origin_path", () => {
    renderFrom("/blog/meu-post");
    const link = screen.getAllByRole("link", { name: /WhatsApp/ })[0];
    expect(text(link.getAttribute("href"))).toBe(`${PRE_MESSAGE}
[ref: blog-meu-post]`);
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_cta", expect.objectContaining({ origin_path: "/blog/meu-post" }));
  });

  it("a pessoa edita a referência e ela vai na mensagem; apagada, some", () => {
    renderFrom("/blog/meu-post");
    const field = screen.getByLabelText(/Referência/);
    expect(field.value).toBe("blog-meu-post");
    fireEvent.change(field, { target: { value: "Indicação do João" } });
    expect(text(screen.getAllByRole("link", { name: /WhatsApp/ })[1].getAttribute("href"))).toContain("[ref: indica-o-do-jo-o]");
    fireEvent.change(field, { target: { value: "" } });
    expect(text(screen.getAllByRole("link", { name: /WhatsApp/ })[1].getAttribute("href"))).toBe(PRE_MESSAGE);
  });

  it("origem inválida (query, admin, site externo) é ignorada: sem campo, sem ref, sem origin_path", () => {
    renderFrom("https://evil.com/x");
    expect(screen.queryByLabelText(/Referência/)).toBeNull();
    const link = screen.getAllByRole("link", { name: /WhatsApp/ })[0];
    expect(text(link.getAttribute("href"))).toBe(PRE_MESSAGE);
    fireEvent.click(link);
    expect(trackEvent.mock.calls.find((c) => c[0] === "pre_diagnostico_cta")[1]).not.toHaveProperty("origin_path");
  });

  it("e-mail também leva a linha de referência", () => {
    renderFrom("/blog/meu-post");
    const mail = screen.getAllByRole("link", { name: /e-mail/ })[0].getAttribute("href");
    expect(decodeURIComponent(mail)).toMatch(/Cidade: \n\[ref: blog-meu-post\]$/);
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

  it("dentro de um post, o link e o evento levam a origem (sem query string)", () => {
    render(
      <MemoryRouter initialEntries={["/blog/meu-post?utm_source=x&email=a@b.com"]}>
        <PreDiagnosticoCard location="post" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Quero o meu/ });
    expect(link.getAttribute("href")).toBe("/pre-diagnostico?de=/blog/meu-post");
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("pre_diagnostico_card_click", { link_location: "post", origin_path: "/blog/meu-post" });
  });
});
