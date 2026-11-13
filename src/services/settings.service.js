import api from "./api";

// Recursos do blog (backend app/routes/settings.routes.js)
const SettingsService = {
  async getFeatures() {
    const { data } = await api.get("/settings/features/admin");
    return data;
  },

  async setFeature(name, on) {
    const { data } = await api.patch("/settings/features", { [name]: on });
    return data;
  },
};

export default SettingsService;
