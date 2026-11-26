import api from "./api";
import { memoRequest } from "../utils/memo";

const ClustersService = {
  // Lista fixa dos temas [{ slug, title, description }] (editor, selo do post)
  getAll: memoRequest(async () => {
    const { data } = await api.get("/clusters", { cacheable: true });
    return Array.isArray(data) ? data : [];
  }),

  // { cluster, pillar, posts } — ou null se o tema não existe ou não tem post publicado
  async getPublicOne(slug) {
    // soft=1: inexistente volta null (200), sem erro de rede no console
    const { data } = await api.get(`/clusters/${encodeURIComponent(slug)}`, { params: { soft: 1 } });
    return data || null;
  },
};

export default ClustersService;
