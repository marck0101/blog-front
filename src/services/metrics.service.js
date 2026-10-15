import api from "./api";

const MetricsService = {
  // Audiência, origem dos assinantes e desempenho dos envios no período
  async overview(days = 30) {
    const { data } = await api.get("/metrics/overview", { params: { days } });
    return data;
  },

  // Favoritos, compartilhamentos por canal, visitas por compartilhamento e comentários
  async engagement(days = 30) {
    const { data } = await api.get("/metrics/engagement", { params: { days } });
    return data;
  },

  // { links: [{ url, clicks, uniqueClicks }], timeline: [{ day, opens }], automated }
  async campaign(id) {
    const { data } = await api.get(`/metrics/campaigns/${id}`);
    return data;
  },
};

export default MetricsService;
