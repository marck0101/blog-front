import { describe, expect, it } from "vitest";
import { isPrivatePath } from "./analytics";

// GA4, Clarity e Pixel nunca rodam onde há dado de assinante (SEC-03)
describe("isPrivatePath", () => {
  it.each(["/admin", "/admin/subscribers", "/cancelar-inscricao"])("%s não é medido", (path) => {
    expect(isPrivatePath(path)).toBe(true);
  });

  it.each(["/blog", "/blog/um-post", "/seasons", "/favoritos"])("%s é medido", (path) => {
    expect(isPrivatePath(path)).toBe(false);
  });
});
