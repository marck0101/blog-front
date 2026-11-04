import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firstSchedulableDay, isOverdue, postDayKey, postStatusKey } from "./postStatus";

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
