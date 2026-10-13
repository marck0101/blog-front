import { useState } from "react";
import { Crown, Download } from "lucide-react";
import FilterChips from "../FilterChips";
import RecipientStatus from "../RecipientStatus";
import { RECIPIENT_STATUS_LABELS } from "../../utils/campaignAudience";

const formatDateTime = (date) => (date ? new Date(date).toLocaleString("pt-BR") : "");

function exportRecipientsCsv(campaign) {
  const escape = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["email", "nome", "membro", "status", "enviado_em", "erro", "abriu_em", "aberturas", "clicou_em", "cliques", "cancelou_em"],
    ...campaign.recipients.map((r) => [
      r.email,
      r.subscriber?.name || "",
      r.subscriber?.tier === "member" ? "sim" : "não",
      RECIPIENT_STATUS_LABELS[r.status],
      formatDateTime(r.sentAt),
      r.error || "",
      formatDateTime(r.openedAt),
      r.opens || 0,
      formatDateTime(r.clickedAt),
      r.clicks || 0,
      formatDateTime(r.unsubscribedAt),
    ]),
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map(escape).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `envio-${campaign._id}-destinatarios.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_FILTERS = Object.entries(RECIPIENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
// Envios com rastreio também filtram por engajamento
const ENGAGEMENT_FILTERS = [
  { value: "opened", label: "Abriram" },
  { value: "clicked", label: "Clicaram" },
  { value: "not-opened", label: "Não abriram" },
  { value: "unsubscribed", label: "Cancelaram" },
];
const matchesFilter = (r, filter) => {
  switch (filter) {
    case "all": return true;
    case "opened": return Boolean(r.openedAt);
    case "clicked": return Boolean(r.clickedAt);
    case "not-opened": return r.status === "sent" && !r.openedAt;
    case "unsubscribed": return Boolean(r.unsubscribedAt);
    default: return r.status === filter;
  }
};

function Engagement({ r }) {
  if (r.status !== "sent") return <span className="text-gray-400">—</span>;
  const tags = [];
  if (r.clickedAt) tags.push(["Clicou", "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", `${r.clicks} clique(s), primeiro em ${formatDateTime(r.clickedAt)}`]);
  else if (r.openedAt) tags.push(["Abriu", "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", `Primeira abertura em ${formatDateTime(r.openedAt)}`]);
  if (r.unsubscribedAt) tags.push(["Cancelou", "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", `Cancelou em ${formatDateTime(r.unsubscribedAt)}`]);
  if (tags.length === 0) return <span className="text-xs text-gray-400">Não abriu</span>;
  return (
    <span className="inline-flex gap-1">
      {tags.map(([label, cls, title]) => (
        <span key={label} title={title} className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
      ))}
    </span>
  );
}

/**
 * Destinatários de um envio: status por pessoa, busca, filtro e CSV.
 * Usado no detalhe do envio e no modal de público da lista.
 */
export default function RecipientsTable({ campaign }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const recipients = campaign.recipients || [];

  const term = search.trim().toLowerCase();
  const visible = recipients.filter(
    (r) =>
      matchesFilter(r, status) &&
      (!term || r.email.includes(term) || r.subscriber?.name?.toLowerCase().includes(term))
  );

  if (recipients.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900">
      <div className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Destinatários ({recipients.length})
          </p>
          <button
            type="button"
            onClick={() => exportRecipientsCsv(campaign)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
        <input name="recipientsSearch"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email ou nome..."
          className="input w-full"
        />
        <FilterChips
          options={campaign.tracking ? [...STATUS_FILTERS, ...ENGAGEMENT_FILTERS] : STATUS_FILTERS}
          selected={status}
          onChange={setStatus}
          allLabel="Todos"
          multiSelect={false}
        />
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Nome</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Enviado em</th>
              {campaign.tracking && <th className="px-4 py-2 font-semibold">Engajamento</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.email} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{r.email}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  <span className="inline-flex items-center gap-1">
                    {r.subscriber?.tier === "member" && <Crown size={12} className="text-amber-500" />}
                    {r.subscriber?.name || (r.subscriber ? "—" : <span className="italic text-gray-400">removido</span>)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <RecipientStatus status={r.status} />
                  {r.error && <p className="text-xs text-red-500 mt-1">{r.error}</p>}
                </td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-300 whitespace-nowrap">
                  {formatDateTime(r.sentAt) || "—"}
                </td>
                {campaign.tracking && (
                  <td className="px-4 py-2 whitespace-nowrap"><Engagement r={r} /></td>
                )}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={campaign.tracking ? 5 : 4} className="px-4 py-6 text-center text-gray-400">
                  Nenhum destinatário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
