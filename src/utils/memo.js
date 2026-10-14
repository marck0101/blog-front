// Uma única requisição compartilhada por todos os componentes da página
// (header, chips, formulário…) durante `ttlMs`. Se falhar, a próxima chamada
// tenta de novo.
export function memoRequest(fn, ttlMs = 60_000) {
  let promise = null;
  let at = 0;
  const call = () => {
    if (!promise || Date.now() - at > ttlMs) {
      at = Date.now();
      promise = fn().catch((err) => {
        promise = null;
        throw err;
      });
    }
    return promise;
  };
  call.reset = () => {
    promise = null;
  };
  return call;
}
