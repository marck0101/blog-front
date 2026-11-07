import { Skeleton } from "../Skeleton";

// Mesmo formato do card que vai aparecer, para a página não "pular" ao carregar.
// Use dentro de <Loading> para o leitor de tela saber que está carregando.
export default function PostCardSkeleton({ variant = "grid" }) {
  if (variant === "list") {
    return (
      <div className="flex gap-4 sm:gap-6">
        <Skeleton className="w-28 sm:w-56 shrink-0 aspect-video" rounded="rounded-lg" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-4 py-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 flex-1" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <Skeleton className="w-full aspect-video" rounded="rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
