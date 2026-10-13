// Mesmo formato do card que vai aparecer, para a página não "pular" ao carregar
export default function PostCardSkeleton({ variant = "grid" }) {
  if (variant === "list") {
    return (
      <div className="animate-pulse flex gap-4 sm:gap-6">
        <div className="w-28 sm:w-56 shrink-0 aspect-video rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-full rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="animate-pulse flex gap-4 py-3">
        <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-4 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      {/* Imagem */}
      <div className="w-full aspect-video rounded-xl bg-gray-100" />

      {/* Conteúdo */}
      <div className="pt-3 space-y-2">
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
