import api from "./api";

/**
 * Camada única de comunicação Front <-> API
 */
const PostsService = {
  // ADMIN
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

  // LIXEIRA
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

  // BLOG
  getPublished() {
    return api.get("/posts/published");
  },

  getBySlug(slug) {
    if (!slug) throw new Error("Slug não informado");
    return api.get(`/posts/slug/${slug}`);
  },
};

export default PostsService;


// --------------------------------------------------

// import { api } from "./api";

// export const PostsService = {
//   // BLOG PÚBLICO
//   getPublished: () => api.get("/posts/published"),
//   getBySlug: (slug) => api.get(`/posts/slug/${slug}`),

//   // ADMIN
//   listAdmin: () => api.get("/posts"),
//   getById: (id) => api.get(`/posts/${id}`),
//   create: (data) => api.post("/posts", data),
//   update: (id, data) => api.put(`/posts/${id}`, data),

//   togglePublish: (id, published) => api.put(`/posts/${id}`, { published }),

//   // LIXEIRA
//   listDeleted: () => api.get("/posts/deleted/all"),
//   softDelete: (id) => api.delete(`/posts/${id}`),
//   restore: (id) => api.patch(`/posts/${id}/restore`),
//   deletePermanent: (id) => api.delete(`/posts/${id}/hard`),
// };
