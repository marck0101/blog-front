import api from "./api";

// Cockpit (backend app/routes/cockpit.routes.js)
const CockpitService = {
  // Página "Hoje": receita, prospecção, blog, automações e itens de ação
  async getHoje() {
    const { data } = await api.get("/cockpit/hoje");
    return data;
  },
};

export default CockpitService;
