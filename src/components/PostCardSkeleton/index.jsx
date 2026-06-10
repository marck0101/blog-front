export default function PostCardSkeleton() {
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
