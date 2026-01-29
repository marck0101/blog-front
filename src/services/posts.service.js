import api from "./api";

const normalizeArray = (data) => (Array.isArray(data) ? data : []);

/**
 * Resolve automaticamente o prefixo correto para o backend em produção.
 *
 * Cenários suportados:
 * 1) api.defaults.baseURL = "https://api.blog.marck0101.com.br/api"
 *    => endpoints devem ser "/posts", "/posts/:id", etc.
 *
 * 2) api.defaults.baseURL = "https://api.blog.marck0101.com.br"
 *    => endpoints devem ser "/api/posts", "/api/posts/:id", etc.
 *
 * Isso evita o erro comum de ficar chamando "/api/api/posts" ou "/posts" sem "/api".
 */
const resolvePostsBasePath = () => {
  const base = String(api?.defaults?.baseURL || "").trim().replace(/\/+$/, ""); // remove trailing "/"
  if (!base) {
    // Sem baseURL definida: assume que o axios está apontando para o mesmo host do frontend
    // e que o backend está em /api.
    return "/api/posts";
  }

  // Se a baseURL já termina com "/api", então NÃO devemos repetir "/api" nos endpoints.
  if (base.endsWith("/api")) return "/posts";

  // Caso contrário, a API provavelmente está na raiz do domínio e precisamos prefixar "/api".
  return "/posts";
};

const postsBasePath = () => resolvePostsBasePath();

const withPostsPath = (suffix = "") => {
  const base = postsBasePath();
  const cleanSuffix = String(suffix || "");
  if (!cleanSuffix) return base;
  return cleanSuffix.startsWith("/") ? `${base}${cleanSuffix}` : `${base}/${cleanSuffix}`;
};

const safeId = (id) => encodeURIComponent(String(id ?? "").trim());

const PostsService = {
  /* ================= LISTAGEM ================= */

  async getPublished() {
    // Mantém compatível: sua rota pública deve filtrar publicados no backend
    const { data } = await api.get(withPostsPath(""));
    return normalizeArray(data);
  },

  async getAll() {
    // Se você tiver uma rota separada para admin (ex.: /all), troque aqui.
    const { data } = await api.get(withPostsPath(""));
    return normalizeArray(data);
  },

  /* ================= POST PÚBLICO ================= */

  async getPublicById(id) {
    const { data } = await api.get(withPostsPath(`/${safeId(id)}`));
    return data || null;
  },

  /* ================= POST ADMIN ================= */

  async getById(id) {
    const { data } = await api.get(withPostsPath(`/${safeId(id)}`));
    return data || null;
  },

  /* ================= CRIAÇÃO ================= */

  async create(payload) {
    const { data } = await api.post(withPostsPath(""), payload);
    return data;
  },

  /* ================= LIXEIRA ================= */

  async getTrash() {
    const { data } = await api.get(withPostsPath("/trash/list"));
    return normalizeArray(data);
  },

  async trash(id) {
    const { data } = await api.patch(withPostsPath(`/trash/${safeId(id)}`));
    return data;
  },

  async restore(id) {
    const { data } = await api.patch(withPostsPath(`/restore/${safeId(id)}`));
    return data;
  },
};

export default PostsService;
