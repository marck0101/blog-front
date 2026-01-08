export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // warning | danger | info
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const colors = {
    info: "bg-blue-600 hover:bg-blue-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    danger: "bg-red-600 hover:bg-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl">
        <div className="p-5 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>

        <div className="p-5 flex justify-end gap-3">
          <button
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
            onClick={onConfirm}
            className={`
              px-4 py-2 rounded-lg text-sm text-white
              ${colors[type]}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
