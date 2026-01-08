import axios from "axios";

const isProd = import.meta.env.MODE === "production";

const baseURL = isProd
  ? import.meta.env.VITE_API_BASE_URL_PROD
  : import.meta.env.VITE_API_BASE_URL_DEV;

if (!baseURL) {
  console.error("❌ VITE_API_BASE_URL não definida para o ambiente atual");
}

const api = axios.create({
  baseURL,
});

export default api;
