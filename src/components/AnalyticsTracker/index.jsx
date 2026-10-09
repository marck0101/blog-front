import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CONSENT_EVENT, syncAnalytics } from "../../utils/analytics";

// Fica dentro do BrowserRouter: reavalia Clarity/GA4 a cada troca de rota
// e quando o visitante responde ao banner de cookies.
export default function AnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    syncAnalytics(pathname);
    const onConsent = () => syncAnalytics(pathname);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [pathname]);

  return null;
}
