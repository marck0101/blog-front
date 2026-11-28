import { describe, expect, it } from "vitest";
import {
  AUDIENCE_LABELS,
  CAMPAIGN_STATUS,
  audienceLabel,
  audienceToApi,
  campaignStatusKey,
  emptyAudience,
} from "./campaignAudience";

describe("emptyAudience", () => {
  it("começa em membros, sem listas e sem excluir membros", () => {
    expect(emptyAudience()).toEqual({ type: "members", categories: [], subscribers: [], lists: [], excludeMembers: false });
  });
  it("aceita outro tipo inicial", () => {
    expect(emptyAudience("post-category").type).toBe("post-category");
  });
});

describe("audienceToApi", () => {
  it("assinantes viram só os ids (objeto ou id solto)", () => {
    const api = audienceToApi({ type: "selected", subscribers: [{ _id: "a" }, "b"] });
    expect(api.subscribers).toEqual(["a", "b"]);
  });

  it("campos ausentes viram listas vazias", () => {
    expect(audienceToApi({ type: "members" })).toEqual({
      type: "members",
      categories: [],
      subscribers: [],
      lists: [],
      excludeMembers: false,
    });
  });

  it("excludeMembers só vale nos tipos que permitem", () => {
    expect(audienceToApi({ type: "all", excludeMembers: true }).excludeMembers).toBe(true);
    expect(audienceToApi({ type: "lists", excludeMembers: true }).excludeMembers).toBe(true);
    expect(audienceToApi({ type: "members", excludeMembers: true }).excludeMembers).toBe(false);
    expect(audienceToApi({ type: "selected", excludeMembers: true }).excludeMembers).toBe(false);
  });

  it("post-category sem categoria informada é mantido (salvo no post)", () => {
    expect(audienceToApi({ type: "post-category" }).type).toBe("post-category");
  });

  it("post-category com a categoria do post vira categories (prévia/contagem)", () => {
    expect(audienceToApi({ type: "post-category", excludeMembers: true }, "seo")).toEqual({
      type: "categories",
      categories: ["seo"],
      excludeMembers: true,
    });
  });

  it("post-category com categoria vazia: categories vazio", () => {
    expect(audienceToApi({ type: "post-category" }, "").categories).toEqual([]);
  });
});

describe("audienceLabel", () => {
  it("usa o rótulo do tipo", () => {
    expect(audienceLabel({ type: "members" })).toBe(AUDIENCE_LABELS.members);
  });
  it("acrescenta 'exceto membros' só em all, categories e lists", () => {
    expect(audienceLabel({ type: "all", excludeMembers: true })).toBe("Todos os assinantes (exceto membros)");
    expect(audienceLabel({ type: "categories", excludeMembers: true })).toBe("Por categorias (exceto membros)");
    expect(audienceLabel({ type: "lists", excludeMembers: true })).toBe("Públicos (exceto membros)");
    expect(audienceLabel({ type: "post-category", excludeMembers: true })).toBe("Categoria do post");
  });
  it("sem argumento ou tipo desconhecido: vazio", () => {
    expect(audienceLabel()).toBe("");
    expect(audienceLabel({ type: "x" })).toBe("");
  });
});

describe("campaignStatusKey", () => {
  it("status diferente de sent passa direto", () => {
    expect(campaignStatusKey({ status: "draft" })).toBe("draft");
    expect(campaignStatusKey({ status: "sending" })).toBe("sending");
  });
  it("sent sem falhas (ou sem stats): enviado", () => {
    expect(campaignStatusKey({ status: "sent", stats: { sent: 10, failed: 0 } })).toBe("sent");
    expect(campaignStatusKey({ status: "sent" })).toBe("sent");
  });
  it("sent com falhas e alguém recebeu: parcial", () => {
    expect(campaignStatusKey({ status: "sent", stats: { sent: 8, failed: 2 } })).toBe("partial");
  });
  it("sent em que ninguém recebeu: falhou", () => {
    expect(campaignStatusKey({ status: "sent", stats: { sent: 0, failed: 5 } })).toBe("failed");
  });
  it("toda chave possível tem rótulo", () => {
    for (const key of ["draft", "sending", "sent", "partial", "failed"]) expect(CAMPAIGN_STATUS[key].label).toBeTruthy();
  });
});
