import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/posts.service", () => ({ default: { engage: vi.fn() } }));
const { default: PostsService } = await import("../services/posts.service");
const { recordPostView } = await import("./postViews");

// BIZ-02: leitura contada uma vez por post por sessão, nunca no navegador do autor
describe("recordPostView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("conta a primeira leitura da sessão", () => {
    recordPostView({ _id: "p1" });
    expect(PostsService.engage).toHaveBeenCalledWith("p1", "view");
  });

  it("recarregar ou voltar ao mesmo post não conta de novo", () => {
    recordPostView({ _id: "p1" });
    recordPostView({ _id: "p1" });
    expect(PostsService.engage).toHaveBeenCalledTimes(1);
  });

  it("outro post conta", () => {
    recordPostView({ _id: "p1" });
    recordPostView({ _id: "p2" });
    expect(PostsService.engage).toHaveBeenCalledTimes(2);
  });

  it("navegador do autor (entrou no painel) não conta", () => {
    localStorage.setItem("user", JSON.stringify({ name: "Admin" }));
    recordPostView({ _id: "p1" });
    expect(PostsService.engage).not.toHaveBeenCalled();
  });

  it("post sem id não chama a API", () => {
    recordPostView(null);
    recordPostView({});
    expect(PostsService.engage).not.toHaveBeenCalled();
  });
});
