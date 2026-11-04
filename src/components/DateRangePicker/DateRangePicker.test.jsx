import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DateRangePicker from ".";

// Lint zero: a sincronização com o pai deixou de ser useEffect (ajuste no render)
describe("DateRangePicker", () => {
  afterEach(cleanup);

  it("mostra o período recebido", () => {
    render(<DateRangePicker from="2026-11-01" to="2026-11-30" onChange={vi.fn()} />);
    expect(screen.getByText("01/11/2026 → 30/11/2026")).toBeTruthy();
  });

  it("acompanha o pai: limpar filtros zera a seleção", () => {
    const { rerender } = render(<DateRangePicker from="2026-11-01" to="2026-11-30" onChange={vi.fn()} />);
    rerender(<DateRangePicker from="" to="" onChange={vi.fn()} />);
    expect(screen.getByText("Selecionar período")).toBeTruthy();
  });

  it("acompanha o pai: outro período", () => {
    const { rerender } = render(<DateRangePicker from="2026-11-01" to="2026-11-30" onChange={vi.fn()} />);
    rerender(<DateRangePicker from="2026-12-01" to="2026-12-15" onChange={vi.fn()} />);
    expect(screen.getByText("01/12/2026 → 15/12/2026")).toBeTruthy();
  });
});
