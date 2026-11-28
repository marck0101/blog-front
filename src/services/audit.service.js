import api from "./api";

const AuditService = {
  // Registro de ações do admin (SEC-09). Só leitura.
  // params: { page, limit (1-100), action, from, to ("AAAA-MM-DD") }
  // -> { entries, total, page, totalPages }
  async list(params = {}) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    const { data } = await api.get("/admin/audit", { params: clean });
    return data;
  },
};

export default AuditService;
