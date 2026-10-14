import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Página nova abre no topo. No "voltar" (POP) o navegador restaura a posição,
// e link com âncora (#assinar) deixa o navegador rolar até ela.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP" || hash) return;
    window.scrollTo(0, 0);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
