import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AppError from "./AppError";

afterEach(cleanup);

// Erro numa página: tela amigável, sem stack trace nem mensagem técnica
describe("tela de erro do app", () => {
  it("não mostra o detalhe do erro ao visitante", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = () => {
      throw new URIError("URI malformed em /segredo/interno.js:42");
    };
    const router = createMemoryRouter([{ path: "/", element: <Boom />, errorElement: <AppError /> }]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("heading", { name: "Algo deu errado nesta página" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/URI malformed|segredo|interno\.js|Unexpected Application Error/);
    expect(screen.getByRole("link", { name: "Voltar ao blog" }).getAttribute("href")).toBe("/blog");
  });
});
