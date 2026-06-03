import api from "./api";

const normalizeArray = (data) => (Array.isArray(data) ? data : []);

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

const PostsService = {
  /* ================= BLOG PÚBLICO ================= */

  // Retorna { posts, total, page, totalPages }
  async getPublished(page = 1, limit = 20) {
    const { data } = await api.get("/posts/published", { params: { page, limit } });
    return data;
  },

  async getPublicById(id) {
    const { data } = await api.get(`/posts/public/${safeId(id)}`);
    return data || null;
  },

  async getBySlug(slug) {
    const { data } = await api.get(`/posts/slug/${encodeURIComponent(slug)}`);
    return data || null;
  },

  /* ================= ADMIN ================= */

  // Retorna { posts, total, page, totalPages }
  async getAll(page = 1, limit = 10) {
    const { data } = await api.get("/posts", { params: { page, limit } });
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

  /* ================= IMAGENS ================= */

  async removeImage(id, imageUrl) {
    const { data } = await api.delete(`/posts/${safeId(id)}/images`, {
      data: { imageUrl },
    });
    return data;
  },
};

export default PostsService;
