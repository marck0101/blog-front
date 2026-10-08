import { RECIPIENT_STATUS_LABELS } from "../../utils/campaignAudience";

const STYLES = {
  sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};


export default function RecipientStatus({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {RECIPIENT_STATUS_LABELS[status]}
    </span>
  );
}
