import { useEffect, useState } from "react";
import { CONSENT_EVENT, CONSENT_KEY, PREFERENCES_EVENT } from "../../utils/analytics";

// Já respondeu ao banner? Sem localStorage (navegação privada restrita), pergunta.
function hasAnswered() {
  try {
    return Boolean(localStorage.getItem(CONSENT_KEY));
  } catch {
    return false;
  }
}

// Nada de medição antes da resposta: GA4, Clarity e Pixel só carregam com "all"
// (ver analyticsAllowed). "Preferências de cookies" no rodapé reabre o banner.
export default function CookieBanner() {
  // Lido uma vez, no primeiro render (sem efeito: não renderiza duas vezes)
  const [visible, setVisible] = useState(() => !hasAnswered());

  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, []);

  const answer = (level) => {
    try {
      localStorage.setItem(CONSENT_KEY, level);
    } catch {
      /* sem localStorage: vale só nesta visita */
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Posso medir as visitas (Google Analytics e Microsoft Clarity) e os anúncios
          (Pixel da Meta)? Nada disso é carregado se você recusar. Detalhes na{" "}
          <a
            href="/privacidade"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => answer("essential")}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => answer("all")}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
