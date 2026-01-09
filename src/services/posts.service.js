import api from "./api";

/**
 * Camada única de comunicação Front <-> API
 */
const PostsService = {
  // =========================
  // ADMIN
  // =========================
  listAdmin() {
    return api.get("/posts");
  },

  getById(id) {
    if (!id) throw new Error("ID do post não informado");
    return api.get(`/posts/${id}`);
  },

  create(data) {
    return api.post("/posts", data);
  },

  update(id, data) {
    if (!id) throw new Error("ID do post não informado");
    return api.put(`/posts/${id}`, data);
  },

  togglePublish(id, published) {
    if (!id) throw new Error("ID do post não informado");
    return api.put(`/posts/${id}`, { published });
  },

  // =========================
  // LIXEIRA
  // =========================
  softDelete(id) {
    if (!id) throw new Error("ID do post não informado");
    return api.delete(`/posts/${id}`);
  },

  listDeleted() {
    return api.get("/posts/deleted/all");
  },

  restore(id) {
    if (!id) throw new Error("ID do post não informado");
    return api.patch(`/posts/${id}/restore`);
  },

  deletePermanent(id) {
    if (!id) throw new Error("ID do post não informado");
    return api.delete(`/posts/${id}/hard`);
  },

  // =========================
  // BLOG PÚBLICO
  // =========================
  getPublished() {
    return api.get("/posts/published");
  },

  /**
   * NOVO – busca pública por ID (rota estável)
   */
  getPublicById(id) {
    if (!id) throw new Error("ID do post não informado");
    return api.get(`/posts/public/${id}`);
  },

  /**
   * (Opcional / legado)
   */
  getBySlug(slug) {
    if (!slug) throw new Error("Slug não informado");
    return api.get(`/posts/slug/${slug}`);
  },
};

export default PostsService;
