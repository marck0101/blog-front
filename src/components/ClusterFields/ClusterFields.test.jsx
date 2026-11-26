import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ClusterFields from "./index";

vi.mock("../../services/clusters.service", () => ({
  default: {
    getAll: () =>
      Promise.resolve([
        { slug: "dashboards-e-bi", title: "Dashboards e BI", description: "Sobre dashboards." },
        { slug: "trafego-pago-medido", title: "Tráfego pago medido", description: "Sobre tráfego." },
      ]),
  },
}));

afterEach(cleanup);

describe("ClusterFields", () => {
  it("lista os temas e mostra a marca de pilar só com tema escolhido", async () => {
    const { rerender } = render(<ClusterFields cluster="" isPillar={false} onChange={() => {}} />);
    expect(await screen.findByRole("option", { name: "Dashboards e BI" })).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();

    rerender(<ClusterFields cluster="dashboards-e-bi" isPillar={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: /Artigo principal do tema/ })).toBeTruthy();
    expect(screen.getByText("Sobre dashboards.")).toBeTruthy();
  });

  it("tirar o tema desmarca o pilar", async () => {
    const onChange = vi.fn();
    render(<ClusterFields cluster="dashboards-e-bi" isPillar onChange={onChange} />);
    fireEvent.change(await screen.findByLabelText(/Tema/), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ cluster: "", isPillar: false });
  });
});
