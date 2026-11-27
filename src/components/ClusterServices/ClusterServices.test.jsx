import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClusterServices, PostServiceLink } from "./ClusterServices";

afterEach(cleanup);
const trackEvent = vi.fn();
vi.mock("../../utils/analytics", () => ({ trackEvent: (...a) => trackEvent(...a) }));

const wrap = (ui) => render(<MemoryRouter initialEntries={["/temas/x"]}>{ui}</MemoryRouter>);

describe("ClusterServices", () => {
  beforeEach(() => trackEvent.mockClear());

  it("lista os serviços do tema com o nome como texto do link e dispara service_click", () => {
    wrap(<ClusterServices clusterSlug="site-rapido-e-encontravel" />);
    expect(screen.getByRole("heading", { name: "Quer que eu faça isso por você?" })).toBeTruthy();
    const link = screen.getByRole("link", { name: /Site rápido no celular/ });
    expect(link.getAttribute("href")).toBe("https://servicos.marck0101.com.br/servicos/performance");
    expect(screen.getAllByRole("link")).toHaveLength(3);
    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith("service_click", { item_id: "performance", origin_path: "/temas/x" });
  });

  it("não renderiza nada para tema sem serviços", () => {
    const { container } = wrap(<ClusterServices clusterSlug="seguranca-na-diretoria" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("PostServiceLink", () => {
  it("mostra só o primeiro serviço", () => {
    wrap(<PostServiceLink clusterSlug="trafego-pago-medido" />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText(/Serviço relacionado:/)).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://servicos.marck0101.com.br/servicos/trafego");
  });
  it("some sem tema ou sem serviços", () => {
    expect(wrap(<PostServiceLink clusterSlug="seguranca-na-diretoria" />).container.innerHTML).toBe("");
    expect(wrap(<PostServiceLink clusterSlug={undefined} />).container.innerHTML).toBe("");
  });
});
