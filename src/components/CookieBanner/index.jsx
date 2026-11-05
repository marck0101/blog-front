import { useState } from "react";
import { CONSENT_EVENT } from "../../utils/analytics";

// Já respondeu ao aviso? (localStorage pode ser bloqueado no modo privado)
function hasAnswered() {
  try {
    return Boolean(localStorage.getItem("cookiesAccepted"));
  } catch {
    return false;
  }
}

export default function CookieBanner() {
  // O app usa createRoot (sem hidratação): dá para ler o localStorage já no
  // primeiro render, sem efeito e sem render extra
  const [visible, setVisible] = useState(() => !hasAnswered());

  const accept = (level) => {
    try {
      localStorage.setItem("cookiesAccepted", level);
    } catch {
      /* sem localStorage: vale só para esta visita */
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Usamos cookies para melhorar sua experiência. Ao continuar navegando,
          você concorda com nossa{" "}
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
            onClick={() => accept("essential")}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Apenas essenciais
          </button>
          <button
            onClick={() => accept("all")}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
