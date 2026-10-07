import api from "./api";

const AuthService = {
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // { token }
  },

  async forgotPassword(email) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(token, password) {
    const res = await api.post("/auth/reset-password", { token, password });
    return res.data;
  },
};

export default AuthService;
