import { useState } from "react";
import { Crown, Download } from "lucide-react";
import FilterChips from "../FilterChips";
import RecipientStatus from "../RecipientStatus";
import { RECIPIENT_STATUS_LABELS } from "../../utils/campaignAudience";

const formatDateTime = (date) => (date ? new Date(date).toLocaleString("pt-BR") : "");

function exportRecipientsCsv(campaign) {
  const escape = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["email", "nome", "membro", "status", "enviado_em", "erro"],
    ...campaign.recipients.map((r) => [
      r.email,
      r.subscriber?.name || "",
      r.subscriber?.tier === "member" ? "sim" : "não",
      RECIPIENT_STATUS_LABELS[r.status],
      formatDateTime(r.sentAt),
      r.error || "",
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
      (status === "all" || r.status === status) &&
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email ou nome..."
          className="input w-full"
        />
        <FilterChips
          options={STATUS_FILTERS}
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
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
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
