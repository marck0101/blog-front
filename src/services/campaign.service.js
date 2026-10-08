import api from "./api";

const CampaignService = {
  async getAll() {
    const { data } = await api.get("/campaigns");
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

  async audienceCount(audience) {
    const { data } = await api.post("/campaigns/audience-count", { audience });
    return data.count;
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
