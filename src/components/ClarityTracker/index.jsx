import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CONSENT_EVENT, syncClarity } from "../../utils/clarity";

// Fica dentro do BrowserRouter: reavalia o Clarity a cada troca de rota
// e quando o visitante responde ao banner de cookies.
export default function ClarityTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    syncClarity(pathname);
    const onConsent = () => syncClarity(pathname);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [pathname]);

  return null;
}
