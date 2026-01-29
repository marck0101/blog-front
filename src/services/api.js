import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

// GARANTE QUE NUNCA USA CACHE DO BROWSER
api.interceptors.request.use((config) => {
  config.params = {
    ...(config.params || {}),
    _ts: Date.now(), // cache buster
  };
  return config;
});

export default api;
