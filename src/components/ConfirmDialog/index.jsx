import { useEffect, useId, useRef } from "react";

const COLORS = {
  info: "bg-blue-600 hover:bg-blue-700",
  warning: "bg-yellow-600 hover:bg-yellow-700",
  danger: "bg-red-600 hover:bg-red-700",
};

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Confirmação antes de uma ação (excluir, publicar, desconectar…).
 * Acessível: anunciado como diálogo, Esc e clique fora cancelam, o foco começa
 * em "Cancelar" (seguro em ação destrutiva), fica preso no diálogo e volta para
 * onde estava ao fechar.
 */
export default function ConfirmDialog({ open, ...props }) {
  return open ? <Dialog {...props} /> : null;
}

function Dialog({
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // warning | danger | info
  onConfirm,
  onCancel,
  children,
}) {
  const panel = useRef(null);
  const cancelButton = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Foco no "Cancelar" ao abrir; de volta ao botão que abriu, ao fechar
  useEffect(() => {
    const previous = document.activeElement;
    cancelButton.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel?.();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...panel.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={onKeyDown}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl"
      >
        <div className="p-5 border-b dark:border-gray-800">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          {description && (
            <p id={descriptionId} className="text-sm text-gray-500 dark:text-gray-300 mt-2">
              {description}
            </p>
          )}
        </div>

        {/* Conteúdo extra opcional (ex.: "não perguntar de novo") */}
        {children && <div className="px-5 pt-4">{children}</div>}

        <div className="p-5 flex justify-end gap-3">
          <button
            ref={cancelButton}
            type="button"
            onClick={onCancel}
            className="
              px-4 py-2 rounded-lg text-sm
              border border-gray-300 dark:border-gray-700
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`
              px-4 py-2 rounded-lg text-sm text-white
              ${COLORS[type]}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
