import api from "./api";

/**
 * Login em duas etapas (ver blog-backend/app/routes/auth.routes.js):
 *   1. Google (googleLoginUrl) ou senha (login) → etapa intermediária
 *   2. app autenticador: setup + enable (1º acesso) ou verify
 * A sessão fica num cookie httpOnly; nenhum token passa pelo JavaScript.
 */
const AuthService = {
  // O navegador vai até a API, que redireciona para o Google
  googleLoginUrl() {
    return `${import.meta.env.VITE_API_URL}/auth/google/start`;
  },

  // Senha (reserva). Devolve { next: "verify" | "setup" }
  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  // Etapa 2 em andamento? { method, email, enrolled } — erro 401 se não
  async pending() {
    const res = await api.get("/auth/2fa/pending");
    return res.data;
  },

  // 1º acesso: { qr (data URL), secret }
  async setup() {
    const res = await api.post("/auth/2fa/setup");
    return res.data;
  },

  // Confirma o cadastro: { user, recoveryCodes }
  async enable(code) {
    const res = await api.post("/auth/2fa/enable", { code });
    return res.data;
  },

  // Código do app ou de recuperação: { user, recoveryCodesLeft? }
  async verify(code) {
    const res = await api.post("/auth/2fa/verify", { code });
    return res.data;
  },

  // Sessão atual: { user, security }; 401 (erro) = não está logado
  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  async regenerateRecoveryCodes(code) {
    const res = await api.post("/auth/2fa/recovery-codes", { code });
    return res.data.recoveryCodes;
  },

  async logout() {
    await api.post("/auth/logout");
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
