import { lazy } from "react";

// Depois de um deploy, uma aba aberta com a versão anterior pede arquivos de
// página que não existem mais e a tela ficaria em branco. Nesse caso recarrega
// uma vez para pegar a versão nova; se falhar de novo logo em seguida (erro
// real, sem rede), deixa o erro aparecer em vez de entrar em loop.
const RELOAD_KEY = "chunk-reload-at";
const RETRY_WINDOW_MS = 10_000;

export function reloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (last && Date.now() - last < RETRY_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sem sessionStorage: recarrega mesmo assim */
  }
  window.location.reload();
  return true;
}

export default function lazyPage(factory) {
  return lazy(() =>
    factory().catch((err) => {
      // Promessa que não resolve: a página recarrega antes de qualquer render
      if (reloadForNewVersion()) return new Promise(() => {});
      throw err;
    })
  );
}
