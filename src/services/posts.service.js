import api from "./api";

const normalizeArray = (data) => (Array.isArray(data) ? data : []);

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

const PostsService = {
  /* ================= BLOG PÚBLICO ================= */

  // Retorna { posts, total, page, totalPages }
  async getPublished(page = 1, limit = 20, filters = {}) {
    const params = { page, limit };
    const { categories = [], search = "", dateFrom = "", dateTo = "", excludePinned = false, sort = "" } = filters;
    // recent (padrão) | oldest | popular | az
    if (sort && sort !== "recent") params.sort = sort;
    if (categories.length) params.categories = categories.join(",");
    // Home sem filtro: os fixados aparecem na vitrine e não repetem na lista
    if (excludePinned) params.excludePinned = 1;
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get("/posts/published", { params });
    return data;
  },

  // Vitrine da home (cache curto na API/CDN)
  async getPinned() {
    const { data } = await api.get("/posts/pinned", { cacheable: true });
    return normalizeArray(data);
  },

  async getHighlights() {
    const { data } = await api.get("/posts/highlights", { cacheable: true });
    return normalizeArray(data);
  },

  // Evento anônimo do leitor (favoritar, compartilhar). Nunca atrapalha a página.
  engage(id, type, channel) {
    return api.post(`/posts/public/${safeId(id)}/engage`, { type, channel }).catch(() => {});
  },

  // "Continue lendo": até 3 da mesma categoria (completa com outras)
  async getRelated(id) {
    const { data } = await api.get(`/posts/public/${safeId(id)}/related`, { cacheable: true });
    return normalizeArray(data);
  },

  async getPublicById(id) {
    const { data } = await api.get(`/posts/public/${safeId(id)}`);
    return data || null;
  },

  // Retorna { season, posts } — só episódios publicados, em ordem
  async getSeasonEpisodes(season) {
    const { data } = await api.get(`/posts/season/${encodeURIComponent(season)}`);
    return data;
  },

  // Admin: todas as seasons, no formato dos chips ({ slug, label })
  async getSeasons() {
    const { data } = await api.get("/seasons/admin");
    return normalizeArray(data).map((s) => ({ slug: s.slug, label: s.title }));
  },

  async getBySlug(slug) {
    // soft=1: post inexistente volta como null (200), sem erro de rede no console
    const { data } = await api.get(`/posts/slug/${encodeURIComponent(slug)}`, { params: { soft: 1 } });
    return data || null;
  },

  /* ================= ADMIN ================= */

  // Retorna { posts, total, page, totalPages }
  async getAll(page = 1, limit = 10, filters = {}) {
    const {
      statusFilter = "all",
      categories = [],
      search = "",
      dateFrom = "",
      dateTo = "",
      season = "",
    } = filters;
    const params = { page, limit };
    if (["published", "planned", "draft"].includes(statusFilter)) params.status = statusFilter;
    // status exato do post: "draft" | "planned" | "published"
    if (filters.status) params.status = filters.status;
    if (season) params.season = season;
    if (categories.length) params.categories = categories.join(",");
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await api.get("/posts", { params });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/posts/${safeId(id)}`);
    return data || null;
  },

  async create(payload) {
    const { data } = await api.post("/posts", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/posts/${safeId(id)}`, payload);
    return data;
  },

  async togglePublish(id, published) {
    const { data } = await api.put(`/posts/${safeId(id)}`, { published });
    return data;
  },

  /* ================= VITRINE ================= */

  // { maxPinned, highlightDays, pinned, highlights, ranking }
  async getShowcase() {
    const { data } = await api.get("/posts/showcase");
    return data;
  },

  // ids na ordem da vitrine; [] desafixa todos
  async setPinned(ids) {
    const { data } = await api.put("/posts/showcase/pinned", { ids });
    return data;
  },

  // "auto" | "force" | "hide"
  async setHighlight(id, highlight) {
    const { data } = await api.patch(`/posts/${safeId(id)}/highlight`, { highlight });
    return data;
  },

  /* ================= LIXEIRA ================= */

  async getTrash() {
    const { data } = await api.get("/posts/deleted/all");
    return normalizeArray(data);
  },

  async softDelete(id) {
    const { data } = await api.delete(`/posts/${safeId(id)}`);
    return data;
  },

  async restore(id) {
    const { data } = await api.patch(`/posts/${safeId(id)}/restore`);
    return data;
  },

  async deletePermanent(id) {
    const { data } = await api.delete(`/posts/${safeId(id)}/hard`);
    return data;
  },

  /* ================= CALENDÁRIO / HEATMAP ================= */

  async getCalendar(year, month) {
    const { data } = await api.get("/posts/calendar", { params: { year, month } });
    return data;
  },

  async getHeatmap(year) {
    const { data } = await api.get("/posts/heatmap", { params: { year } });
    return data;
  },

  async getTodayPlanned() {
    const { data } = await api.get("/posts/today-planned");
    return data;
  },

  async publishNow(id) {
    const { data } = await api.put(`/posts/${safeId(id)}`, {
      status: "published",
      published: true,
      publishedAt: new Date().toISOString(),
    });
    return data;
  },

  /* ================= IMAGENS ================= */

  async removeImage(id, imageUrl) {
    const { data } = await api.delete(`/posts/${safeId(id)}/images`, {
      data: { imageUrl },
    });
    return data;
  },
};

export default PostsService;
