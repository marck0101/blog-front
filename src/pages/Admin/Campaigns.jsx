import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Plus, AlertCircle, Search } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import RecipientStatus from "../../components/RecipientStatus";
import CampaignService from "../../services/campaign.service";
import { audienceLabel } from "../../utils/campaignAudience";

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    sending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  const labels = { draft: "Rascunho", sending: "Enviando", sent: "Enviado" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setAppliedEmail(emailSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [emailSearch]);

  useEffect(() => {
    CampaignService.getAll(appliedEmail ? { email: appliedEmail } : {})
      .then((data) => {
        setCampaigns(data);
        setError(null);
      })
      .catch(() => setError("Não foi possível carregar os envios."))
      .finally(() => setLoading(false));
  }, [appliedEmail]);

  const byEmail = Boolean(appliedEmail);
  const columns = byEmail ? 6 : 5;

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Envios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Conteúdos exclusivos e newsletters enviados por email
            </p>
          </div>
          <Link
            to="/admin/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Novo envio
          </Link>
        </div>

        <div className="mb-6 relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="Buscar por email do destinatário..."
            className="input w-full pl-9"
          />
          {byEmail && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
              {campaigns.length} envio{campaigns.length !== 1 ? "s" : ""} para emails contendo "{appliedEmail}"
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white dark:bg-gray-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 font-semibold">Assunto</th>
                <th className="px-4 py-3 font-semibold">Público</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Entregues</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                {byEmail && <th className="px-4 py-3 font-semibold">Para este email</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={columns} className="px-4 py-8 text-center text-gray-400">Carregando...</td>
                </tr>
              )}

              {!loading && campaigns.length === 0 && (
                <tr>
                  <td colSpan={columns} className="px-4 py-12 text-center text-gray-500 dark:text-gray-300">
                    <Mail size={32} className="mx-auto mb-3 opacity-30" />
                    {byEmail ? "Nenhum envio foi para este email." : "Nenhum envio ainda."}
                  </td>
                </tr>
              )}

              {!loading && campaigns.map((c) => (
                <tr
                  key={c._id}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/campaigns/${c._id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600"
                    >
                      {c.subject}
                    </Link>
                    {c.kind === "post-notification" && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 whitespace-nowrap">
                        Aviso automático
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {audienceLabel(c.audience)}
                    {c.audience?.type === "selected" && (
                      <span className="text-gray-400"> · {c.audienceSize}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {c.status === "draft" ? "—" : `${c.stats.sent}/${c.stats.total}`}
                    {c.stats.failed > 0 && (
                      <span className="ml-2 text-xs text-red-500">{c.stats.failed} falha(s)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-300 whitespace-nowrap">
                    {new Date(c.sentAt || c.updatedAt).toLocaleDateString("pt-BR")}
                  </td>
                  {byEmail && (
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {c.matches?.map((m) => (
                          <li key={m.email} className="flex items-center gap-2 whitespace-nowrap">
                            <RecipientStatus status={m.status} />
                            <span className="text-xs text-gray-600 dark:text-gray-300">{m.email}</span>
                            {m.sentAt && (
                              <span className="text-xs text-gray-400">
                                {new Date(m.sentAt).toLocaleString("pt-BR")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
