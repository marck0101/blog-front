import { Link } from "react-router-dom";
import { CheckCircle2, Layers } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { formatMinutes } from "../../utils/readingTime";
import { seasonStatus, useSeasonProgress } from "../../utils/seasonProgress";
import GeneratedCover from "../GeneratedCover";

/** Barra "2 de 4 lidos" — some quando a pessoa ainda não começou */
export function SeasonProgressBar({ readCount, total, className = "" }) {
  if (!readCount || !total) return null;
  const pct = Math.round((readCount / total) * 100);
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>
          {readCount} de {total} lidos
        </span>
        {readCount === total && (
          <span className="inline-flex items-center gap-1 font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 size={14} /> Concluída
          </span>
        )}
      </div>
      <div
        className="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${readCount} de ${total} episódios lidos`}
      >
        <div className="h-full bg-blue-600 dark:bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Card de season (/seasons e destaque da home): capa, episódios, tempo total
 * e progresso de leitura. Quem já começou vai direto ao próximo episódio.
 */
export default function SeasonCard({ season, headingLevel = "h2" }) {
  const progress = useSeasonProgress();
  const status = seasonStatus(progress, season.slug, season.episodeSlugs);
  const cover = normalizeImageUrl(season.coverImage);
  const Heading = headingLevel;

  const continueTo = status.started && !status.done && status.next ? `/blog/${status.next}` : null;

  return (
    <article className="group h-full flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition hover:border-blue-400 hover:shadow-md">
      <Link to={`/seasons/${season.slug}`} className="flex-1 flex flex-col">
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {cover ? (
            <img src={cover} alt="" width={640} height={360} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <GeneratedCover title={season.title} categoryLabel="Season" />
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col gap-1.5">
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-300">
            <Layers size={12} />
            {season.episodes} {season.episodes === 1 ? "episódio" : "episódios"}
            {season.readingMinutes > 0 && <> · ~{formatMinutes(season.readingMinutes)} de leitura</>}
          </p>
          <Heading className="font-semibold text-lg leading-snug text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {season.title}
          </Heading>
          {season.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{season.description}</p>
          )}
          <SeasonProgressBar readCount={status.readCount} total={status.total} className="mt-2" />
          {!continueTo && (
            <span className="mt-auto pt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              {status.done ? "Rever episódios →" : "Ver episódios →"}
            </span>
          )}
        </div>
      </Link>
      {continueTo && (
        <Link
          to={continueTo}
          className="mx-4 mb-4 inline-flex justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Continuar de onde parei →
        </Link>
      )}
    </article>
  );
}
