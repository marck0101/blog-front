import api from "./api";
import { memoRequest } from "../utils/memo";

const SubscriberService = {
  async subscribe(payload) {
    const { data } = await api.post("/subscribers", payload);
    return data;
  },

  // Compartilhada entre header, chips e formulários (lista fixa no backend)
  getCategories: memoRequest(async () => {
    const { data } = await api.get("/categories", { cacheable: true });
    // Se a API estiver mal configurada (ex.: VITE_API_URL vazio) chega HTML, não array
    return Array.isArray(data) ? data : [];
  }, 60 * 60_000),

  // CSV com os mesmos filtros da lista; baixa como arquivo no navegador
  async exportCsv(params = {}) {
    const { data, headers } = await api.get("/subscribers/export.csv", { params, responseType: "blob" });
    const match = /filename="([^"]+)"/.exec(headers["content-disposition"] || "");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = match?.[1] || "assinantes.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async getAll(params = {}) {
    const { data } = await api.get("/subscribers", { params });
    return data;
  },

  async createManual(payload) {
    const { data } = await api.post("/subscribers/manual", payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/subscribers/${id}`);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/subscribers/${id}`, payload);
    return data;
  },
};

export default SubscriberService;
