import api from "./api";

const AuthService = {
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // { token }
  },
};

export default AuthService;
