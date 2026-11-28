import api from "./api";
import { memoRequest } from "../utils/memo";
import { prerendered } from "../utils/prerendered";

const SiteService = {
  // FAQ da home e de /seasons: { blog, seasons } (fonte única na API, OPS-01).
  // O prerender já injeta no HTML; fora dele (navegação interna) busca uma vez só.
  getFaq: memoRequest(async () => {
    if (prerendered("siteFaq")) return prerendered("siteFaq");
    const { data } = await api.get("/site/faq", { cacheable: true });
    return data;
  }, 3_600_000),
};

export default SiteService;
