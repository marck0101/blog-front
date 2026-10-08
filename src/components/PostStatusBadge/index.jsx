import { POST_STATUS, isOverdue, postStatusDate, postStatusKey } from "../../utils/postStatus";

/** Selo de status do post com a data (publicado em / agendado para / calendário) */
export default function PostStatusBadge({ post, showDate = true, className = "" }) {
  const key = postStatusKey(post);
  const overdue = isOverdue(post);
  const date = showDate ? postStatusDate(post) : "";

  return (
    <span
      title={overdue ? "A data passou e o post ainda não foi publicado" : undefined}
      className={`inline-flex items-center shrink-0 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
        overdue ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" : POST_STATUS[key].style
      } ${className}`}
    >
      {overdue ? "Atrasado" : POST_STATUS[key].label}
      {date && ` · ${date}`}
    </span>
  );
}
