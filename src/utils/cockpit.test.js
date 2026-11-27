import { describe, expect, it } from "vitest";
import { isStale, sourceLine, timeAgo } from "./cockpit";

const NOW = new Date("2026-11-27T12:00:00Z").getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

describe("timeAgo", () => {
  it("escolhe a unidade", () => {
    expect(timeAgo(ago(10_000), NOW)).toBe("agora");
    expect(timeAgo(ago(5 * 60_000), NOW)).toBe("há 5 min");
    expect(timeAgo(ago(3 * 3_600_000), NOW)).toBe("há 3 h");
    expect(timeAgo(ago(2 * 86_400_000), NOW)).toBe("há 2 d");
    expect(timeAgo(null, NOW)).toBe("nunca");
  });
});

describe("isStale", () => {
  it("só passa do dobro esperado", () => {
    expect(isStale({ updatedAt: ago(86_400_000), staleAfterSec: 172_800 }, NOW)).toBe(false);
    expect(isStale({ updatedAt: ago(3 * 86_400_000), staleAfterSec: 172_800 }, NOW)).toBe(true);
  });
  it("tile ao vivo nunca fica velho; sem data e com prazo, fica", () => {
    expect(isStale({ updatedAt: ago(9e9), staleAfterSec: null }, NOW)).toBe(false);
    expect(isStale({ updatedAt: null, staleAfterSec: 100 }, NOW)).toBe(true);
  });
});

describe("sourceLine", () => {
  it("fonte e idade", () => {
    expect(sourceLine({ source: "prospect0101", updatedAt: ago(5 * 60_000) }, NOW)).toBe("prospect0101 · atualizado há 5 min");
    expect(sourceLine({ source: "prospect0101", updatedAt: null }, NOW)).toBe("prospect0101 · sem atualização");
  });
});
