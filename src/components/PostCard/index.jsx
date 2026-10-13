import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { AUTHOR_NAME } from "../../seo/site";

// Lista: capa pequena ao lado do texto
function ListCard({ post, coverSrc, date, categoryLabel }) {
  return (
    <article className="group">
      <Link
        to={`/blog/${post.slug || post.id}`}
        className="flex gap-4 sm:gap-6 items-start rounded-xl p-2 -m-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="w-28 sm:w-56 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {coverSrc ? (
            <img src={coverSrc} alt="" width={320} height={180} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="text-gray-300" size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            {date}
            {categoryLabel && <> • {categoryLabel}</>}
          </p>
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

// variant: "grid" (padrão) | "list" | "compact"
export default function PostCard({ post, variant = "grid", categoryLabel }) {
  const coverSrc = normalizeImageUrl(post.coverImage);
  const date = new Date(post.publishedAt).toLocaleDateString();

  if (variant === "list") return <ListCard post={post} coverSrc={coverSrc} date={date} categoryLabel={categoryLabel} />;
  if (variant === "compact") return <CompactCard post={post} date={date} categoryLabel={categoryLabel} />;

  return (
    <article className="group cursor-pointer">
      <Link to={`/blog/${post.slug || post.id}`} className="block">
        {/* IMAGEM */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={post.title}
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <FileText className="text-gray-300" size={48} />
            </div>
          )}

          {/* Faixa sólida que cresce com o texto (sem altura fixa), mais escura
              que o original, com sombra no texto como reforço extra de contraste */}
          <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/75 backdrop-blur-sm px-4 py-3">
            <p
              className="text-xs text-white/90 mb-0.5"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {date} • {AUTHOR_NAME}
            </p>
            <h2
              className="text-white font-semibold text-base md:text-lg leading-snug line-clamp-2 transition-colors duration-150 group-hover:text-blue-300"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            >
              {post.title}
            </h2>
          </div>
        </div>

        {/* CONTEÚDO abaixo da imagem */}
        <div className="pt-3">
          {post.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          <div className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            Ler artigo →
          </div>
        </div>
      </Link>
    </article>
  );
}
