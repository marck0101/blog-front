import api from "./api";
import { memoRequest } from "../utils/memo";

const ExperimentsService = {
  // Sorteios em andamento no site: [{ chave, alvo, variantes: [{ chave, texto }] }].
  // Público e cacheável (a API manda Cache-Control de 60s); uma busca só para toda a página.
  getAtivos: memoRequest(async () => {
    const { data } = await api.get("/experiments/ativos", { cacheable: true });
    return Array.isArray(data) ? data : [];
  }),
};

export default ExperimentsService;
