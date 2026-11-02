import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmDialog from ".";

// DUP-04: confirmação padrão do painel e do blog, acessível
describe("ConfirmDialog", () => {
  afterEach(cleanup);

  const setup = (props = {}) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <>
        <button type="button">abriu o diálogo</button>
        <ConfirmDialog open title="Excluir post?" description="Não dá para desfazer." confirmText="Excluir" onConfirm={onConfirm} onCancel={onCancel} {...props} />
      </>
    );
    return { onConfirm, onCancel };
  };

  it("fechado não renderiza nada", () => {
    render(<ConfirmDialog open={false} title="x" />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("é anunciado como diálogo, com título e descrição", () => {
    setup();
    const dialog = screen.getByRole("alertdialog", { name: "Excluir post?" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("foco começa em Cancelar (seguro em ação destrutiva)", () => {
    setup();
    expect(document.activeElement.textContent).toBe("Cancelar");
  });

  it("Esc e clique fora cancelam; confirmar chama onConfirm", () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByRole("alertdialog").parentElement);
    expect(onCancel).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText("Excluir"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("Tab fica preso dentro do diálogo", () => {
    setup();
    const confirm = screen.getByText("Excluir");
    confirm.focus();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Tab" });
    expect(document.activeElement.textContent).toBe("Cancelar");
  });

  it("foco volta para onde estava ao fechar", () => {
    const opener = () => screen.getByText("abriu");
    const { rerender } = render(<button type="button">abriu</button>);
    opener().focus();
    rerender(
      <>
        <button type="button">abriu</button>
        <ConfirmDialog open title="x" onCancel={() => {}} />
      </>
    );
    expect(document.activeElement.textContent).toBe("Cancelar");
    rerender(
      <>
        <button type="button">abriu</button>
        <ConfirmDialog open={false} title="x" />
      </>
    );
    expect(document.activeElement).toBe(opener());
  });
});
