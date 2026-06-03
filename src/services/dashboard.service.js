import api from "./api";

const DashboardService = {
  async getStats() {
    const { data } = await api.get("/dashboard/stats");
    return data;
  },
};

export default DashboardService;
