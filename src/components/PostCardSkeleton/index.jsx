export default function PostCardSkeleton() {
  return (
    <div
      className="
        flex gap-6 p-5 rounded-xl border
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-800
        animate-pulse
      "
    >
      {/* Imagem */}
      <div
        className="
          w-40 h-28 rounded-lg
          bg-gray-200 dark:bg-gray-800
          flex-shrink-0
        "
      />

      {/* Conteúdo */}
      <div className="flex-1 space-y-3">
        <div
          className="
            h-4 w-32 rounded
            bg-gray-200 dark:bg-gray-700
          "
        />

        <div
          className="
            h-6 w-2/3 rounded
            bg-gray-200 dark:bg-gray-700
          "
        />

        <div
          className="
            h-4 w-full rounded
            bg-gray-200 dark:bg-gray-700
          "
        />
      </div>
    </div>
  );
}
