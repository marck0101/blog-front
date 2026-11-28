import { useEffect, useState } from "react";
import SiteService from "../services/site.service";
import { prerendered } from "../utils/prerendered";
import { resolveSiteFaq } from "../seo/site";

// FAQ da home e de /seasons vindo da API (fonte única). Começa na versão do prerender
// (igual ao HTML que o Google leu) ou na reserva embutida; se a API responder diferente,
// troca. Se falhar, a reserva fica: o FAQ e o schema FAQPage nunca somem.
export default function useSiteFaq() {
  const [faq, setFaq] = useState(() => resolveSiteFaq(prerendered("siteFaq")));

  useEffect(() => {
    let alive = true;
    SiteService.getFaq()
      .then((raw) => alive && setFaq(resolveSiteFaq(raw)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return faq;
}
