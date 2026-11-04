import PostsService from "../services/posts.service";
import { isAuthorBrowser } from "./analytics";

/**
 * Conta a leitura do post (BIZ-02): uma por post a cada sessão do navegador
 * (recarregar ou voltar ao post não soma de novo). O navegador do autor não
 * conta (mesmo critério do GA4/Clarity: ?notrack=1 ou ter entrado no painel).
 * Robôs são filtrados pela API (user-agent).
 */
const KEY = (id) => `post-view:${id}`;

export function recordPostView(post) {
  const id = post?._id || post?.id;
  if (!id || isAuthorBrowser()) return;
  try {
    if (sessionStorage.getItem(KEY(id))) return;
    sessionStorage.setItem(KEY(id), "1");
  } catch {
    /* sem sessionStorage: conta mesmo assim */
  }
  PostsService.engage(id, "view");
}
