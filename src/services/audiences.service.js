import api from "./api";

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

// Públicos nomeados (listas) e importação de contatos
const AudiencesService = {
  // [{ _id, name, description, total, active, createdAt }]
  async getAll() {
    const { data } = await api.get("/audiences");
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const { data } = await api.post("/audiences", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/audiences/${safeId(id)}`, payload);
    return data;
  },

  // Manda para a lixeira (as pessoas continuam ligadas ao público)
  async remove(id) {
    await api.delete(`/audiences/${safeId(id)}`);
  },

  /* ================= LIXEIRA ================= */

  async getTrash() {
    const { data } = await api.get("/audiences/trash");
    return Array.isArray(data) ? data : [];
  },

  async restore(id) {
    const { data } = await api.patch(`/audiences/${safeId(id)}/restore`);
    return data;
  },

  // Só da lixeira: apaga o público; as pessoas continuam como assinantes
  async deletePermanent(id) {
    await api.delete(`/audiences/${safeId(id)}/hard`);
  },

  async removeMember(id, subscriberId) {
    await api.delete(`/audiences/${safeId(id)}/members/${safeId(subscriberId)}`);
  },

  // rows: [{ email, name, line }] (até 1000 por chamada)
  async importRows(id, { rows, categories, consent }) {
    const { data } = await api.post(`/audiences/${safeId(id)}/import`, { rows, categories, consent });
    return data;
  },
};

export default AudiencesService;
