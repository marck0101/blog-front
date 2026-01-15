import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_ENV,
  // baseURL: "http://localhost:3333/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
