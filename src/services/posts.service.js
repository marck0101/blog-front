import api from "./api";

/**
 * Camada única de comunicação Front <-> API
 * Backend base: /api/posts
 */
const PostsService = {
  // =========================
  // ADMIN
  // =========================

  listAdmin() {
    return api.get("/posts");
  },

  getById(id) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.get(`/posts/${id}`);
  },

  create(data) {
    if (!data) {
      throw new Error("Dados do post não informados");
    }
    return api.post("/posts", data);
  },

  update(id, data) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    if (!data) {
      throw new Error("Dados do post não informados");
    }
    return api.put(`/posts/${id}`, data);
  },

  // =========================
  // PUBLICAÇÃO
  // =========================

  togglePublish(id, published) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.put(`/posts/${id}`, { published });
  },

  // =========================
  // LIXEIRA
  // =========================

  softDelete(id) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.delete(`/posts/${id}`);
  },

  listDeleted() {
    return api.get("/posts/deleted/all");
  },

  restore(id) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.patch(`/posts/${id}/restore`);
  },

  deletePermanent(id) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.delete(`/posts/${id}/hard`);
  },

  // =========================
  // BLOG PÚBLICO
  // =========================

  /**
   * Lista apenas posts publicados
   * GET /api/posts/published
   */
  getPublished() {
    return api.get("/posts/published");
  },

  /**
   * Busca pública por ID
   * GET /api/posts/public/:id
   */
  getPublicById(id) {
    if (!id) {
      throw new Error("ID do post não informado");
    }
    return api.get(`/posts/public/${id}`);
  },

  /**
   * Busca pública por slug
   * GET /api/posts/slug/:slug
   */
  getBySlug(slug) {
    if (!slug) {
      throw new Error("Slug não informado");
    }
    return api.get(`/posts/slug/${slug}`);
  },
};

export default PostsService;
