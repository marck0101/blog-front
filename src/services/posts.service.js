import api from "./api";

const PostsService = {
  /* ================= LISTAGEM ================= */

  async getPublished() {
    const { data } = await api.get("/posts");
    return data;
  },

  async getAll() {
    const { data } = await api.get("/posts");
    return data;
  },

  /* ================= POST POR ID ================= */

  async getById(id) {
    const { data } = await api.get(`/posts/${id}`);
    return data;
  },

  // trash
  async getTrash() {
    const { data } = await api.get("/posts/trash/list");
    return data;
  },

  async trash(id) {
    const { data } = await api.patch(`/posts/trash/${id}`);
    return data;
  },

  async restore(id) {
    const { data } = await api.patch(`/posts/restore/${id}`);
    return data;
  },
};

export default PostsService;

