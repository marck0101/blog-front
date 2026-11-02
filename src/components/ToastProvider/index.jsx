import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ToastContext } from "../../context/toastContext";

// Tempo na tela: erro e aviso com ação ficam mais, para dar tempo de ler/agir
const DURATION = { success: 3500, error: 6000, action: 7000 };

/**
 * Aviso único do site e do painel (DUP-04). Um aviso por vez: o novo substitui
 * o anterior e reinicia o tempo (antes, o timer do primeiro fechava o segundo).
 * Pausa com o mouse em cima ou com o foco no aviso; tem botão de fechar.
 * Leitor de tela: a região "status" está sempre na página e anuncia cada aviso;
 * erro sai como "alert".
 */
export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const schedule = useCallback((current) => {
    clearTimeout(timer.current);
    if (!current) return;
    const ms = current.action ? DURATION.action : DURATION[current.type] || DURATION.success;
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const showToast = useCallback(
    (message, type = "success", action = null) => {
      // id novo: o mesmo texto duas vezes seguidas também é anunciado de novo
      const next = { message, type: type === "error" ? "error" : "success", action, id: Date.now() };
      setToast(next);
      schedule(next);
    },
    [schedule]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const runAction = () => {
    const onClick = toast?.action?.onClick;
    close();
    onClick?.();
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div aria-live="polite" className="fixed top-6 right-6 left-6 sm:left-auto z-[80] flex justify-end pointer-events-none">
        {toast && (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={() => schedule(toast)}
            onFocus={() => clearTimeout(timer.current)}
            onBlur={() => schedule(toast)}
            className={`pointer-events-auto max-w-md px-4 py-3 rounded-lg text-sm shadow-lg flex items-center gap-3 ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={runAction}
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" onClick={close} aria-label="Fechar aviso" className="opacity-80 hover:opacity-100">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
