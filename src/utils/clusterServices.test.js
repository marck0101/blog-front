import { describe, expect, it } from "vitest";
import { CLUSTER_SERVICES, SERVICES, servicesForCluster } from "./clusterServices";

describe("clusterServices", () => {
  it("mapeia o tema para os serviços na ordem", () => {
    expect(servicesForCluster("trafego-pago-medido").map((s) => s.url)).toEqual([
      "https://servicos.marck0101.com.br/servicos/trafego",
      "https://servicos.marck0101.com.br/servicos/tagueamento",
    ]);
    expect(servicesForCluster("engenharia-no-marketing")).toHaveLength(3);
  });
  it("tema sem serviço ou desconhecido devolve vazio", () => {
    expect(servicesForCluster("seguranca-na-diretoria")).toEqual([]);
    expect(servicesForCluster("nao-existe")).toEqual([]);
    expect(servicesForCluster("constructor")).toEqual([]);
  });
  it("todo serviço do mapa tem nome", () => {
    for (const list of Object.values(CLUSTER_SERVICES)) for (const s of list) expect(SERVICES[s]).toBeTruthy();
  });
});
