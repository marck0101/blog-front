import { describe, expect, it } from "vitest";
import { errorText } from "./apiError";

// DUP-01: um jeito só de ler o erro da API
describe("errorText", () => {
  const err = (data) => ({ response: { data } });

  it("lê { error }", () => expect(errorText(err({ error: "Título curto" }))).toBe("Título curto"));
  it("aceita o formato antigo { message } das rotas de login", () => expect(errorText(err({ message: "Código incorreto" }))).toBe("Código incorreto"));
  it("prefere error quando vêm os dois", () => expect(errorText(err({ error: "A", message: "B" }))).toBe("A"));
  it.each([
    ["sem resposta (rede caiu)", new Error("Network Error")],
    ["corpo HTML", err("<html>502</html>")],
    ["corpo sem texto de erro", err({ ok: false })],
    ["undefined", undefined],
  ])("%s → vazio, para cair no texto padrão da tela", (_, e) => {
    expect(errorText(e)).toBe("");
  });
});
