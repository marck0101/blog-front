import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastProvider from ".";
import { useToast } from "../../hooks/useToast";

// DUP-04: aviso único de resultado (salvar, excluir, erro…)
// Entrega o showToast ao teste por callback (o componente não reatribui nada de fora)
function Capture({ expose }) {
  const show = useToast();
  useEffect(() => expose?.(show), [expose, show]);
  return null;
}
let showToast;
const setup = () =>
  render(
    <ToastProvider>
      <Capture expose={(fn) => (showToast = fn)} />
    </ToastProvider>
  );
const show = (...args) => act(() => showToast(...args));
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

describe("ToastProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("mostra o aviso de sucesso como status e some sozinho", () => {
    setup();
    show("Post salvo");
    expect(screen.getByRole("status")).toHaveProperty("textContent", expect.stringContaining("Post salvo"));
    wait(3600);
    expect(screen.queryByText("Post salvo")).toBeNull();
  });

  it("erro sai como alert e fica mais tempo", () => {
    setup();
    show("Erro ao salvar", "error");
    expect(screen.getByRole("alert").textContent).toContain("Erro ao salvar");
    wait(4000);
    expect(screen.queryByText("Erro ao salvar")).not.toBeNull();
    wait(2100);
    expect(screen.queryByText("Erro ao salvar")).toBeNull();
  });

  it("aviso novo reinicia o tempo (o timer do anterior não fecha o novo)", () => {
    setup();
    show("Primeiro");
    wait(3000);
    show("Segundo");
    // Antes da DUP-04, o timer do "Primeiro" fechava o "Segundo" aqui
    wait(1000);
    expect(screen.queryByText("Segundo")).not.toBeNull();
    expect(screen.queryByText("Primeiro")).toBeNull();
  });

  it("ação (Desfazer): roda e fecha o aviso", () => {
    setup();
    const onClick = vi.fn();
    show("Rascunho movido", "success", { label: "Desfazer", onClick });
    fireEvent.click(screen.getByText("Desfazer"));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Rascunho movido")).toBeNull();
  });

  it("botão de fechar", () => {
    setup();
    show("Post salvo");
    fireEvent.click(screen.getByLabelText("Fechar aviso"));
    expect(screen.queryByText("Post salvo")).toBeNull();
  });

  it("mouse em cima pausa o tempo", () => {
    setup();
    show("Leia com calma");
    fireEvent.mouseEnter(screen.getByRole("status"));
    wait(10000);
    expect(screen.queryByText("Leia com calma")).not.toBeNull();
    fireEvent.mouseLeave(screen.getByRole("status"));
    wait(3600);
    expect(screen.queryByText("Leia com calma")).toBeNull();
  });

  it("useToast fora do provider avisa o erro de uso", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Capture />)).toThrow(/ToastProvider/);
  });
});
