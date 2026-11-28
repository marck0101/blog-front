import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { markEpisodeRead, seasonStatus, useSeasonProgress } from "./seasonProgress";

const KEY = "season-progress";

describe("seasonStatus", () => {
  const order = ["ep1", "ep2", "ep3"];

  it("sem progresso: não começou, o próximo é o primeiro", () => {
    expect(seasonStatus({}, "s1", order)).toMatchObject({ readCount: 0, total: 3, started: false, done: false, next: "ep1" });
  });

  it("no meio: next é o primeiro NÃO lido, mesmo com buraco", () => {
    const s = seasonStatus({ s1: ["ep1", "ep3"] }, "s1", order);
    expect(s).toMatchObject({ readCount: 2, started: true, done: false, next: "ep2" });
  });

  it("terminou: done e next nulo", () => {
    expect(seasonStatus({ s1: order }, "s1", order)).toMatchObject({ done: true, next: null, readCount: 3 });
  });

  it("slugs lidos que saíram da season não contam", () => {
    expect(seasonStatus({ s1: ["velho"] }, "s1", order)).toMatchObject({ readCount: 0, started: false });
  });

  it("season sem episódios nunca fica 'done'", () => {
    expect(seasonStatus({}, "s1", [])).toMatchObject({ total: 0, done: false, next: null });
    expect(seasonStatus({}, "s1")).toMatchObject({ total: 0, done: false });
  });
});

describe("markEpisodeRead + useSeasonProgress", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("grava no localStorage e o hook atualiza sozinho", () => {
    const { result } = renderHook(() => useSeasonProgress());
    expect(result.current).toEqual({});
    act(() => markEpisodeRead("s1", "ep1"));
    expect(result.current).toEqual({ s1: ["ep1"] });
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ s1: ["ep1"] });
  });

  it("marcar de novo o mesmo episódio não duplica", () => {
    act(() => markEpisodeRead("s1", "ep1"));
    act(() => markEpisodeRead("s1", "ep1"));
    expect(JSON.parse(localStorage.getItem(KEY)).s1).toEqual(["ep1"]);
  });

  it("seasons diferentes ficam separadas", () => {
    act(() => markEpisodeRead("s1", "a"));
    act(() => markEpisodeRead("s2", "b"));
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ s1: ["a"], s2: ["b"] });
  });

  it("season ou slug vazio é ignorado", () => {
    markEpisodeRead("", "ep1");
    markEpisodeRead("s1", "");
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("JSON corrompido no storage: sem progresso, sem quebrar", () => {
    localStorage.setItem(KEY, "{quebrado");
    const { result } = renderHook(() => useSeasonProgress());
    expect(result.current).toEqual({});
  });

  it("valor que não é objeto: sem progresso", () => {
    localStorage.setItem(KEY, "null");
    const { result } = renderHook(() => useSeasonProgress());
    expect(result.current).toEqual({});
  });
});
