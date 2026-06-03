import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    const is401 = error?.response?.status === 401;
    const isLoginEndpoint = error?.config?.url?.includes("/auth/login");

    if (is401 && !isLoginEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

export default api;
