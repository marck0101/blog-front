import api from "./api";

const normalizeArray = (data) => (Array.isArray(data) ? data : []);

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

/**
 * Backend está em:
 *   https://api.blog.marck0101.com.br
 *
 * Rotas:
 *   GET    /posts
 *   GET    /posts/:id
 *   POST   /posts
 *   GET    /posts/trash/list
 *   PATCH  /posts/trash/:id
 *   PATCH  /posts/restore/:id
 */

const PostsService = {
  /* ================= LISTAGEM ================= */

  async getPublished() {
    const { data } = await api.get("/posts");
    return normalizeArray(data);
  },

  async getAll() {
    const { data } = await api.get("/posts");
    return normalizeArray(data);
  },

  /* ================= POST PÚBLICO ================= */

  async getPublicById(id) {
    const { data } = await api.get(`/posts/${safeId(id)}`);
    return data || null;
  },

  /* ================= POST ADMIN ================= */

  async getById(id) {
    const { data } = await api.get(`/posts/${safeId(id)}`);
    return data || null;
  },

  /* ================= CRIAÇÃO ================= */

  async create(payload) {
    const { data } = await api.post("/posts", payload);
    return data;
  },

  /* ================= LIXEIRA ================= */

  async getTrash() {
    const { data } = await api.get("/posts/trash/list");
    return normalizeArray(data);
  },

  async trash(id) {
    const { data } = await api.patch(`/posts/trash/${safeId(id)}`);
    return data;
  },

  async restore(id) {
    const { data } = await api.patch(`/posts/restore/${safeId(id)}`);
    return data;
  },
};

export default PostsService;
