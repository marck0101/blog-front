import { Link } from "react-router-dom";
import { Layers, Pin } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";
import GeneratedCover from "../GeneratedCover";
import FavoriteButton from "../FavoriteButton";

// Coração sobre a capa: fora do <Link> (botão dentro de link não é válido)
function CardFavorite({ post, className }) {
  return <FavoriteButton post={post} variant="icon" location="card" className={`absolute z-10 ${className}`} />;
}

// Lista: capa pequena ao lado do texto
function ListCard({ post, coverSrc, date, categoryLabel, seasonLabel }) {
  return (
    <article className="group relative">
      <CardFavorite post={post} className="top-0 left-0" />
      <Link
        to={`/blog/${post.slug || post.id}`}
        className="flex gap-4 sm:gap-6 items-start rounded-xl p-2 -m-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="w-28 sm:w-56 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {coverSrc ? (
            <img src={coverSrc} alt="" width={320} height={180} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <GeneratedCover title={post.title} category={post.category} categoryLabel={categoryLabel} size="sm" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            {date}
            {categoryLabel && <> • {categoryLabel}</>}
          </p>
          {seasonLabel && <div className="mt-1"><SeasonBadge label={seasonLabel} /></div>}
          <h2 className="mt-1 font-semibold text-base sm:text-xl leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="hidden sm:block mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
          )}
          <span className="hidden sm:inline-block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">Ler artigo →</span>
        </div>
      </Link>
    </article>
  );
}

// Compacta: só data, categoria e título, para varrer o arquivo
function CompactCard({ post, date, categoryLabel }) {
  return (
    <article className="group">
      <Link
        to={`/blog/${post.slug || post.id}`}
        className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3"
      >
        <span className="shrink-0 sm:w-24 text-xs sm:text-sm text-gray-500 dark:text-gray-300 tabular-nums">{date}</span>
        <h2 className="flex-1 font-medium text-gray-900 dark:text-gray-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline underline-offset-4 transition-colors">
          {post.title}
        </h2>
        {categoryLabel && (
          <span className="hidden sm:inline shrink-0 text-xs text-gray-500 dark:text-gray-300">{categoryLabel}</span>
        )}
      </Link>
    </article>
  );
}

// Selo "Season" no card: mostra que o post faz parte de uma sequência
function SeasonBadge({ label }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
      <Layers size={12} className="shrink-0" />
      <span className="truncate">Season: {label}</span>
    </span>
  );
}

// Selo da vitrine ("Fixado", "Destaque da semana")
function ShowcaseBadge({ badge }) {
  if (!badge) return null;
  return (
    <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
      {badge === "Fixado" && <Pin size={12} className="shrink-0" />}
      {badge}
    </span>
  );
}

// Grade: mesmo padrão do admin — card com borda, capa limpa e texto abaixo,
// todos com a mesma altura na linha
function GridCard({ post, coverSrc, date, categoryLabel, seasonLabel, badge }) {
  return (
    <article className="group h-full relative">
      <CardFavorite post={post} className="top-2 right-2" />
      <Link
        to={`/blog/${post.slug || post.id}`}
        className="h-full flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition hover:border-blue-400 hover:shadow-md"
      >
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <GeneratedCover title={post.title} category={post.category} categoryLabel={categoryLabel} />
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col gap-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            {date}
            {categoryLabel && <> • {categoryLabel}</>}
          </p>
          <ShowcaseBadge badge={badge} />
          <SeasonBadge label={seasonLabel} />
          <h2 className="font-semibold text-lg leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{post.excerpt}</p>
          )}
          <span className="mt-auto pt-2 text-sm font-medium text-blue-600 dark:text-blue-400">Ler artigo →</span>
        </div>
      </Link>
    </article>
  );
}

// variant: "grid" (padrão) | "list" | "compact"
// badge: selo da vitrine na grade ("Fixado")
export default function PostCard({ post, variant = "grid", categoryLabel, seasonLabel, badge }) {
  const coverSrc = normalizeImageUrl(post.coverImage);
  const date = new Date(post.publishedAt).toLocaleDateString("pt-BR");
  const props = { post, coverSrc, date, categoryLabel, seasonLabel, badge };

  if (variant === "list") return <ListCard {...props} />;
  if (variant === "compact") return <CompactCard {...props} />;
  return <GridCard {...props} />;
}
