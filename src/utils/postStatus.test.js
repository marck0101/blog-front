import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST_STATUS, firstSchedulableDay, isOverdue, localDateKey, postDayKey, postStatusDate, postStatusKey, toDateInput } from "./postStatus";

// R-POST-16: mesma regra do backend (post.rules.firstSchedulableDay)
describe("firstSchedulableDay", () => {
  it("antes das 9h de Brasília: hoje", () => {
    expect(firstSchedulableDay(new Date("2026-11-10T11:30:00Z"))).toBe("2026-11-10");
  });
  it("depois das 9h: amanhã, inclusive virando o mês", () => {
    expect(firstSchedulableDay(new Date("2026-11-10T13:00:00Z"))).toBe("2026-11-11");
    expect(firstSchedulableDay(new Date("2026-11-30T20:00:00Z"))).toBe("2026-12-01");
  });
  it("22h de Brasília (já é o dia seguinte em UTC): amanhã", () => {
    expect(firstSchedulableDay(new Date("2026-11-11T01:00:00Z"))).toBe("2026-11-11");
  });
});

// Status do post nas telas (SISTEMA.md, seção 2.1)
describe("postStatusKey", () => {
  it.each([
    [{ status: "draft" }, "draft"],
    [{ status: "planned" }, "planned"],
    [{ status: "published", published: true }, "published"],
    // Legado: só o booleano
    [{ published: true }, "published"],
    // Lixeira vale mais que o status
    [{ status: "published", published: true, deletedAt: "2026-11-01" }, "trash"],
  ])("%j → %s", (post, key) => {
    expect(postStatusKey(post)).toBe(key);
  });
});

describe("isOverdue (agendado atrasado, laranja no calendário)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T15:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("agendado de ontem que não foi ao ar está atrasado", () => {
    expect(isOverdue({ status: "planned", plannedAt: "2026-11-01T12:00:00.000Z" })).toBe(true);
  });

  it("agendado para hoje ainda não está atrasado", () => {
    expect(isOverdue({ status: "planned", plannedAt: "2026-11-02T12:00:00.000Z" })).toBe(false);
  });

  it("rascunho com data passada não conta como atrasado", () => {
    expect(isOverdue({ status: "draft", plannedAt: "2026-10-01T12:00:00.000Z" })).toBe(false);
  });
});

describe("postDayKey (dia no calendário)", () => {
  it("publicado fica no dia da publicação", () => {
    expect(postDayKey({ status: "published", published: true, publishedAt: "2026-11-05T12:00:00.000Z", plannedAt: "2026-11-01T12:00:00.000Z" })).toBe("2026-11-05");
  });

  it("agendado fica no dia planejado (gravado ao meio-dia UTC: mesmo dia no Brasil)", () => {
    expect(postDayKey({ status: "planned", plannedAt: "2026-11-10T12:00:00.000Z" })).toBe("2026-11-10");
  });

  it("rascunho sem data não tem dia", () => {
    expect(postDayKey({ status: "draft" })).toBeNull();
  });
});

describe("postStatusKey (casos extras)", () => {
  it("sem status nem published: rascunho", () => {
    expect(postStatusKey({})).toBe("draft");
  });
  it("todo status tem rótulo e estilo para a tela", () => {
    for (const key of ["draft", "planned", "published", "trash"]) {
      expect(POST_STATUS[key].label).toBeTruthy();
      expect(POST_STATUS[key].style).toBeTruthy();
    }
    expect(POST_STATUS[postStatusKey({ status: "planned" })].label).toBe("Agendado");
  });
});

describe("postStatusDate", () => {
  it("publicado mostra a data de publicação (dd/mm)", () => {
    expect(postStatusDate({ status: "published", published: true, publishedAt: "2026-11-05T12:00:00.000Z" })).toBe("05/11");
  });
  it("agendado e rascunho mostram a data planejada", () => {
    expect(postStatusDate({ status: "planned", plannedAt: "2026-11-10T12:00:00.000Z" })).toBe("10/11");
    expect(postStatusDate({ status: "draft", plannedAt: "2026-11-12T12:00:00.000Z" })).toBe("12/11");
  });
  it("na lixeira ou sem data: vazio", () => {
    expect(postStatusDate({ status: "planned", plannedAt: "2026-11-10T12:00:00.000Z", deletedAt: "2026-11-11" })).toBe("");
    expect(postStatusDate({ status: "draft" })).toBe("");
  });
});

describe("toDateInput / localDateKey", () => {
  it("toDateInput devolve YYYY-MM-DD sem voltar um dia", () => {
    expect(toDateInput("2026-11-10T12:00:00.000Z")).toBe("2026-11-10");
  });
  it("toDateInput sem data: vazio", () => {
    expect(toDateInput("")).toBe("");
    expect(toDateInput(null)).toBe("");
  });
  it("localDateKey usa o fuso local e completa com zero", () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
