import api from "./api";

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

// Caixinha de sugestões (backend app/routes/suggestion.routes.js)
const SuggestionsService = {
  /* ================= LEITOR ================= */

  // { kind, category, message, name, email, allowName, subscribe, sourcePath, website }
  async send(payload) {
    const { data } = await api.post("/suggestions", payload);
    return data;
  },

  // Sugestões que viraram post e o admin escolheu mostrar
  async listPublic() {
    const { data } = await api.get("/suggestions/public", { cacheable: true });
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  },

  /* ================= PAINEL ================= */

  // { suggestions, total, page, totalPages, counts: { new, planned, done, archived } }
  async adminList({ status = "new", page = 1 } = {}) {
    const params = { page };
    if (status) params.status = status;
    const { data } = await api.get("/suggestions/admin", { params });
    return data;
  },

  async newCount() {
    const { data } = await api.get("/suggestions/admin/new-count");
    return data?.count || 0;
  },

  // { status, post, isPublic, publicText, notes, notify } → sugestão + { notified }
  async update(id, payload) {
    const { data } = await api.patch(`/suggestions/admin/${safeId(id)}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/suggestions/admin/${safeId(id)}`);
  },
};

export default SuggestionsService;
