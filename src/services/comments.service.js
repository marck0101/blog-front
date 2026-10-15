import api from "./api";

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

const CommentsService = {
  /* ================= LEITOR ================= */

  // { enabled, reader: { name, picture } | null }
  async me() {
    const { data } = await api.get("/comments/me");
    return data;
  },

  // Login com Google: a página toda vai para a API → Google → volta para o post
  loginUrl(returnPath) {
    return `${import.meta.env.VITE_API_URL}/comments/google/start?return=${encodeURIComponent(returnPath)}`;
  },

  async logout() {
    await api.delete("/comments/session");
  },

  // Aprovados + os pendentes da própria pessoa
  async list(postId) {
    const { data } = await api.get(`/comments/post/${safeId(postId)}`);
    return data?.comments || [];
  },

  async create(postId, body, parentId = null) {
    const { data } = await api.post(`/comments/post/${safeId(postId)}`, { body, parentId });
    return data;
  },

  async removeMine(id) {
    await api.delete(`/comments/mine/${safeId(id)}`);
  },

  /* ================= PAINEL ================= */

  // { comments, total, page, totalPages, counts: { pending, approved, rejected } }
  async adminList({ status = "pending", page = 1, post = "" } = {}) {
    const params = { status, page };
    if (post) params.post = post;
    const { data } = await api.get("/comments/admin", { params });
    return data;
  },

  async pendingCount() {
    const { data } = await api.get("/comments/admin/pending-count");
    return data?.count || 0;
  },

  async setStatus(id, status) {
    const { data } = await api.patch(`/comments/admin/${safeId(id)}`, { status });
    return data;
  },

  async reply(id, body) {
    const { data } = await api.post(`/comments/admin/${safeId(id)}/reply`, { body });
    return data;
  },

  async remove(id) {
    await api.delete(`/comments/admin/${safeId(id)}`);
  },
};

export default CommentsService;
