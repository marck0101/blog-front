import api from "./api";

// Cockpit (backend app/routes/cockpit.routes.js)
const CockpitService = {
  // Página "Hoje": receita, prospecção, blog, automações e itens de ação
  async getHoje() {
    const { data } = await api.get("/cockpit/hoje");
    return data;
  },

  // Automações: estado e últimas execuções de cada rotina
  async getAutomacoes() {
    const { data } = await api.get("/cockpit/automacoes");
    return data;
  },

  // Placar semanal: 10 números x 13 semanas e metas semanais
  async getPlacar() {
    const { data } = await api.get("/cockpit/placar");
    return data;
  },
  async savePlacarMetas(metas) {
    const { data } = await api.put("/cockpit/placar/metas", { metas });
    return data.metas;
  },

  // ===== Experimentos =====
  async listExperiments(params = {}) {
    const { data } = await api.get("/cockpit/experiments", { params });
    return data.experiments || [];
  },
  async createExperiment(body) {
    const { data } = await api.post("/cockpit/experiments", body);
    return data.experiment;
  },
  async updateExperiment(id, body) {
    const { data } = await api.put(`/cockpit/experiments/${id}`, body);
    return data.experiment;
  },
  async transitionExperiment(id, status, result) {
    const { data } = await api.post(`/cockpit/experiments/${id}/transition`, { status, ...(result ? { result } : {}) });
    return data.experiment;
  },
  async removeExperiment(id) {
    await api.delete(`/cockpit/experiments/${id}`);
  },

  // ===== Links =====
  async listLinks() {
    const { data } = await api.get("/cockpit/links");
    return data.links || [];
  },
  async createLink(body) {
    const { data } = await api.post("/cockpit/links", body);
    return data.link;
  },
  async updateLink(id, body) {
    const { data } = await api.put(`/cockpit/links/${id}`, body);
    return data.link;
  },
  async removeLink(id) {
    await api.delete(`/cockpit/links/${id}`);
  },
};

export default CockpitService;
