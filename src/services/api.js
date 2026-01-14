import axios from "axios";

const api = axios.create({
  baseURL: "https://api.blog.marck0101.com.br/",
  // baseURL: "http://localhost:3333/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
