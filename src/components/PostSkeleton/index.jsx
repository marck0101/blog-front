import { Skeleton } from "../Skeleton";

// Linha da lista de posts do painel (capa, título, data, status e ações).
// Use dentro de <Loading> para o leitor de tela saber que está carregando.
export default function PostSkeleton() {
  return (
    <div className="flex gap-4 items-center p-4 rounded-xl border bg-white dark:bg-gray-900">
      <Skeleton className="w-32 h-20 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20 hidden sm:block" />
      <div className="hidden sm:flex gap-3">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  );
}
