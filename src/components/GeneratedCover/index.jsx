// Capa automática para post sem imagem: cor da categoria + título.
// Mantém a grade consistente sem depender de upload.
const PALETTE = {
  tecnologia: "from-blue-600 to-indigo-700",
  design: "from-pink-500 to-rose-600",
  carreira: "from-amber-500 to-orange-600",
  negocios: "from-emerald-600 to-teal-700",
  marketing: "from-violet-600 to-purple-700",
  trafego: "from-orange-500 to-red-600",
  growth: "from-teal-500 to-cyan-700",
};
const FALLBACK = "from-gray-600 to-gray-800";

// size: "lg" (grade, páginas de season) | "sm" (miniatura: só a categoria)
export default function GeneratedCover({ title, category, categoryLabel, size = "lg" }) {
  const gradient = PALETTE[category] || FALLBACK;
  const label = categoryLabel || category;

  return (
    <div
      aria-hidden
      className={`w-full h-full bg-gradient-to-br ${gradient} text-white flex flex-col justify-between ${
        size === "sm" ? "p-2" : "p-4"
      }`}
    >
      {label && (
        <span
          className={`self-start rounded-full bg-white/20 font-medium uppercase tracking-wide ${
            size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
          }`}
        >
          {label}
        </span>
      )}
      {size !== "sm" && title && (
        <span className="font-bold leading-snug text-lg line-clamp-3 drop-shadow-sm">{title}</span>
      )}
    </div>
  );
}
