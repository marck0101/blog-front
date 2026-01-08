export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div
      className="
        mt-10
        flex flex-col items-center justify-center
        text-center
        p-10
        border border-dashed
        rounded-xl
        bg-gray-50 dark:bg-gray-900
        border-gray-300 dark:border-gray-700
      "
    >
      <div className="text-4xl mb-4">📝</div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="
            mt-6
            bg-blue-600 hover:bg-blue-700
            text-white
            px-5 py-2
            rounded-lg
            transition-colors
          "
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
