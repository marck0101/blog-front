import { describe, expect, it } from "vitest";
import { TRANSITIONS, STATUSES, daysLeft, daysLeftText, iceScore, isHttpsUrl, sortByIce, HYPOTHESIS_RE } from "./experiments";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 27, 12);

describe("iceScore", () => {
  it("multiplica impacto, confiança e facilidade", () => {
    expect(iceScore({ impact: 4, confidence: 3, ease: 5 })).toBe(60);
    expect(iceScore({ impact: 5, confidence: 5, ease: 5 })).toBe(125);
  });
  it("incompleto ou fora de 1–5 vale 0", () => {
    expect(iceScore(undefined)).toBe(0);
    expect(iceScore({ impact: 4, confidence: 3 })).toBe(0);
    expect(iceScore({ impact: 6, confidence: 3, ease: 1 })).toBe(0);
  });
});

describe("sortByIce", () => {
  it("maior ICE primeiro sem mexer na lista original", () => {
    const list = [{ id: "a", iceScore: 8 }, { id: "b", iceScore: 60 }, { id: "c", iceScore: 20 }];
    expect(sortByIce(list).map((e) => e.id)).toEqual(["b", "c", "a"]);
    expect(list[0].id).toBe("a");
  });
});

describe("prazo", () => {
  it("conta dias até a data prevista", () => {
    expect(daysLeft(new Date(NOW + 3 * DAY).toISOString(), NOW)).toBe(3);
    expect(daysLeft(null, NOW)).toBeNull();
  });
  it("textos", () => {
    expect(daysLeftText(new Date(NOW + 3 * DAY), NOW)).toBe("faltam 3 dias");
    expect(daysLeftText(new Date(NOW + DAY), NOW)).toBe("falta 1 dia");
    expect(daysLeftText(new Date(NOW), NOW)).toBe("termina hoje");
    expect(daysLeftText(new Date(NOW - 2 * DAY), NOW)).toBe("passaram 2 dias do prazo");
    expect(daysLeftText(null, NOW)).toBe("sem data prevista");
  });
});

describe("mapa de status", () => {
  it("todo status tem transições e só leva a status que existem", () => {
    const keys = STATUSES.map((s) => s.key);
    for (const k of keys) {
      expect(TRANSITIONS[k], k).toBeTruthy();
      for (const to of TRANSITIONS[k]) expect(keys).toContain(to);
    }
  });
});

describe("validações de formulário", () => {
  it("hipótese em Se … então … porque …", () => {
    expect(HYPOTHESIS_RE.test("Se o título tiver número, então o clique sobe, porque é concreto")).toBe(true);
    expect(HYPOTHESIS_RE.test("vamos testar o título")).toBe(false);
  });
  it("só https", () => {
    expect(isHttpsUrl("https://ads.google.com/")).toBe(true);
    for (const bad of ["http://a.com", "javascript:alert(1)", "data:text/html,x", "a.com", "https://u:p@a.com", ""]) {
      expect(isHttpsUrl(bad), bad).toBe(false);
    }
  });
});
