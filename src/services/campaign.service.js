import api from "./api";

const CampaignService = {
  // params.email: só envios que tiveram esse destinatário
  async getAll(params = {}) {
    const { data } = await api.get("/campaigns", { params });
    return data;
  },

  async getCalendar(year, month) {
    const { data } = await api.get("/campaigns/calendar", { params: { year, month } });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/campaigns/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/campaigns", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/campaigns/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/campaigns/${id}`);
    return data;
  },

  // { count, sample: [{ name, email, tier }] }
  async audiencePreview(audience) {
    const { data } = await api.post("/campaigns/audience-count", { audience });
    return data;
  },

  // Teste do email preparado no editor de post (antes de salvar/publicar)
  async sendPostTest(post, email) {
    const { data } = await api.post("/campaigns/test-post", { post, email });
    return data;
  },

  async sendTest(id, email) {
    const { data } = await api.post(`/campaigns/${id}/test`, { email });
    return data;
  },

  // mode: "copy" (mesmo público) | "new-members" (membros que ainda não receberam)
  async duplicate(id, mode = "copy") {
    const { data } = await api.post(`/campaigns/${id}/duplicate`, { mode });
    return data;
  },

  async retryFailed(id) {
    const { data } = await api.post(`/campaigns/${id}/retry-failed`);
    return data;
  },

  // Envia um lote; chamar de novo enquanto stats.pending > 0
  async sendBatch(id) {
    const { data } = await api.post(`/campaigns/${id}/send`);
    return data;
  },
};

export default CampaignService;
