import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

// Sessão do admin: cookie httpOnly enviado pelo navegador (withCredentials).
// Nenhum token passa pelo JavaScript.
api.interceptors.request.use((config) => {
  // Dados que quase não mudam (categorias, seasons) pedem `cacheable: true`:
  // sem _ts e sem os headers no-cache, o navegador usa o Cache-Control da API
  // e a requisição não precisa de preflight CORS (OPTIONS).
  if (config.cacheable) {
    config.headers.delete("Cache-Control");
    config.headers.delete("Pragma");
    return config;
  }

  config.params = {
    ...(config.params || {}),
    _ts: Date.now(),
  };

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sessão expirou no meio do uso do painel: volta para o login.
    // Rotas /auth/* tratam o 401 elas mesmas (login errado, conferência da sessão).
    const is401 = error?.response?.status === 401;
    const isAuthEndpoint = error?.config?.url?.startsWith("/auth/");
    const inPanel = window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login";

    if (is401 && !isAuthEndpoint && inPanel) {
      try {
        localStorage.removeItem("user");
      } catch {
        /* sem localStorage */
      }
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

export default api;
