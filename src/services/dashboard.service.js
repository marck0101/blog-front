import api from "./api";

const DashboardService = {
  async getStats() {
    const { data } = await api.get("/dashboard/stats");
    return data;
  },

  async getContentPerformance(days = 30) {
    const { data } = await api.get("/dashboard/content-performance", { params: { days } });
    return data;
  },
};

export default DashboardService;
