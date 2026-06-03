import api from "./api";

const SubscriberService = {
  async subscribe(payload) {
    const { data } = await api.post("/subscribers", payload);
    return data;
  },

  async getCategories() {
    const { data } = await api.get("/categories");
    return data;
  },

  async getAll(params = {}) {
    const { data } = await api.get("/subscribers", { params });
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
