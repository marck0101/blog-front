import api from "./api";
import { memoRequest } from "../utils/memo";

const SeasonsService = {
  /* ================= BLOG PÚBLICO ================= */

  // Seasons com pelo menos 1 episódio publicado
  // [{ slug, title, description, episodes, coverImage, firstSlug, lastPublishedAt }]
  // Compartilhada entre header, home, breadcrumb e /seasons
  getPublic: memoRequest(async () => {
    const { data } = await api.get("/seasons", { cacheable: true });
    return Array.isArray(data) ? data : [];
  }),

  // { season: { slug, title, description }, posts } — ou null se não existe/não publicada
  async getPublicOne(slug) {
    // soft=1: inexistente volta null (200), sem erro de rede no console
    const { data } = await api.get(`/seasons/${encodeURIComponent(slug)}`, { params: { soft: 1 } });
    return data || null;
  },

  /* ================= ADMIN ================= */

  // Todas, com contagem: posts: { draft, planned, published, total }
  async getAdmin() {
    const { data } = await api.get("/seasons/admin");
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await api.post("/seasons", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/seasons/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/seasons/${id}`);
    return data;
  },
};

export default SeasonsService;
