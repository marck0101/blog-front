import api from "./api";

const DashboardService = {
  async getStats() {
    const { data } = await api.get("/dashboard/stats");
    return data;
  },

  // Mapa de conteúdo: { nodes, links, insights: { totals, orphans, brokenLinks, singleTags } }
  async getContentMap() {
    const { data } = await api.get("/dashboard/content-map");
    return data;
  },

  async getContentPerformance(days = 30) {
    const { data } = await api.get("/dashboard/content-performance", { params: { days } });
    return data;
  },
};

export default DashboardService;
