import api from "./api";

const LinkedInService = {
  // { configured, connected, expired, name, picture, expiresAt, daysLeft }
  async getStatus() {
    const { data } = await api.get("/linkedin/status");
    return data;
  },

  // URL de autorização do LinkedIn; o callback volta para returnTo no painel
  async getConnectUrl(returnTo) {
    const { data } = await api.get("/linkedin/connect", { params: { returnTo } });
    return data.url;
  },

  async disconnect() {
    await api.delete("/linkedin");
  },

  // Publica (ou tenta de novo) o post de um artigo já publicado
  async share(postId, force = false) {
    const { data } = await api.post(`/linkedin/posts/${postId}/share`, { force });
    return data;
  },
};

export default LinkedInService;
