import { useState } from "react";

/**
 * Confirmação para ação irreversível: só libera o botão depois de digitar a
 * palavra pedida (ex.: EXCLUIR). Evita o clique automático no "Confirmar".
 */
export default function TypedConfirmDialog({ open, title, description, word = "EXCLUIR", confirmText = "Excluir", onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  if (!open) return null;

  const ok = typed.trim().toUpperCase() === word;
  const close = () => {
    setTyped("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="typed-confirm-title">
      <form
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          setTyped("");
          onConfirm();
        }}
      >
        <div className="p-5 border-b space-y-3">
          <h2 id="typed-confirm-title" className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-gray-500 dark:text-gray-300">{description}</p>}
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Digite <strong className="font-mono">{word}</strong> para confirmar
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="input mt-1 font-mono"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="p-4 flex justify-end gap-3">
          <button type="button" onClick={close} className="px-4 py-2 rounded-lg border text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={!ok} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}
