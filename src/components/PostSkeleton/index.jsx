export default function PostSkeleton() {
  return (
    <div
      className="
        flex gap-4 items-center p-4 rounded-lg border
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-800
        animate-pulse
      "
    >
      {/* Imagem */}
      <div
        className="
          w-32 h-20 rounded
          bg-gray-200 dark:bg-gray-800
          flex-shrink-0
        "
      />

      {/* Conteúdo */}
      <div className="flex-1 space-y-2">
        <div
          className="
            h-5 w-2/3 rounded
            bg-gray-200 dark:bg-gray-700
          "
        />
        <div
          className="
            h-4 w-1/3 rounded
            bg-gray-200 dark:bg-gray-700
          "
        />
      </div>

      {/* Status */}
      <div
        className="
          h-6 w-20 rounded
          bg-gray-200 dark:bg-gray-700
        "
      />

      {/* Ações */}
      <div className="flex gap-3">
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
