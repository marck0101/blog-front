import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Plus, AlertCircle, Search, Users } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import FilterChips from "../../components/FilterChips";
import RecipientStatus from "../../components/RecipientStatus";
import CampaignAudienceModal from "../../components/CampaignAudienceModal";
import Pagination from "../../components/Pagination";
import CampaignService from "../../services/campaign.service";
import { CAMPAIGN_STATUS, audienceLabel, campaignStatusKey } from "../../utils/campaignAudience";

const STATUS_FILTERS = [
  { value: "sent", label: "Enviados" },
  { value: "partial", label: "Parciais" },
  { value: "failed", label: "Falharam" },
  { value: "sending", label: "Enviando" },
  { value: "draft", label: "Rascunhos" },
];

const KIND_FILTERS = [
  { value: "custom", label: "Envios manuais" },
  { value: "post-notification", label: "Avisos automáticos" },
];

function StatusBadge({ campaign }) {
  const { label, style } = CAMPAIGN_STATUS[campaignStatusKey(campaign)];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}

function Delivery({ campaign }) {
  if (campaign.status === "draft") return <span className="text-gray-400">—</span>;
  const { sent, failed, pending, total } = campaign.stats;

  return (
    <div className="space-y-0.5 whitespace-nowrap">
      <p className="text-gray-900 dark:text-gray-100">
        {sent}/{total} <span className="text-xs text-gray-500 dark:text-gray-300">entregue{sent !== 1 ? "s" : ""}</span>
      </p>
      {failed > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {failed} não enviado{failed !== 1 ? "s" : ""}
        </p>
      )}
      {pending > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {pending} pendente{pending !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function formatDate(c) {
  const date = new Date(c.sentAt || c.startedAt || c.updatedAt);
  return {
    day: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    label: c.sentAt ? "enviado" : c.startedAt ? "iniciado" : "editado",
  };
}

function audienceSizeLabel(c) {
  if (c.status !== "draft") return `${c.stats.total} pessoa${c.stats.total !== 1 ? "s" : ""}`;
  if (c.audience?.type === "selected") return `${c.audienceSize} pessoa${c.audienceSize !== 1 ? "s" : ""}`;
  return "ver público";
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [data, setData] = useState({ campaigns: [], total: 0, page: 1, totalPages: 1 });
  const [loadedKey, setLoadedKey] = useState(null); // filtros da última resposta
  const [error, setError] = useState(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [audienceOf, setAudienceOf] = useState(null); // id do envio aberto no modal
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedEmail(emailSearch.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [emailSearch]);

  const params = { page, limit: 20 };
  if (appliedEmail) params.email = appliedEmail;
  if (statusFilter !== "all") params.status = statusFilter;
  if (kindFilter !== "all") params.kind = kindFilter;
  const requestKey = JSON.stringify(params);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    CampaignService.getAll(JSON.parse(requestKey))
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
      })
      .catch(() => active && setError("Não foi possível carregar os envios."))
      .finally(() => active && setLoadedKey(requestKey));
    return () => { active = false; };
  }, [requestKey]);

  const changeFilter = (setter) => (val) => { setter(val); setPage(1); };
  const visible = data.campaigns;

  const byEmail = Boolean(appliedEmail);
  const columns = byEmail ? 6 : 5;
  const hasFilters = statusFilter !== "all" || kindFilter !== "all" || emailSearch;

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Envios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              Conteúdos exclusivos, newsletters e avisos de posts novos
            </p>
          </div>
          <Link
            to="/admin/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Novo envio
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              placeholder="Buscar por email do destinatário..."
              className="input w-full !pl-9"
            />
          </div>
          <FilterChips
            options={STATUS_FILTERS}
            selected={statusFilter}
            onChange={changeFilter(setStatusFilter)}
            allLabel="Todos os status"
            multiSelect={false}
          />
          <FilterChips
            options={KIND_FILTERS}
            selected={kindFilter}
            onChange={changeFilter(setKindFilter)}
            allLabel="Todos os tipos"
            multiSelect={false}
          />
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300">
            <span>
              {data.total} envio{data.total !== 1 ? "s" : ""}
              {byEmail && ` para emails contendo "${appliedEmail}"`}
            </span>
            {hasFilters && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setKindFilter("all");
                  setEmailSearch("");
                  setPage(1);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
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
                <th className="px-4 py-3 font-semibold">Entrega</th>
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

              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={columns} className="px-4 py-12 text-center text-gray-500 dark:text-gray-300">
                    <Mail size={32} className="mx-auto mb-3 opacity-30" />
                    {byEmail
                      ? "Nenhum envio foi para este email."
                      : !hasFilters
                        ? "Nenhum envio ainda."
                        : "Nenhum envio com esses filtros."}
                  </td>
                </tr>
              )}

              {!loading && visible.map((c) => {
                const date = formatDate(c);
                return (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/admin/campaigns/${c._id}`)}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer align-top"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{c.subject}</p>
                      {c.kind === "post-notification" && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          Aviso automático
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudienceOf(c._id);
                        }}
                        title="Ver quem estava neste envio"
                        className="inline-flex items-start gap-1.5 text-left text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Users size={14} className="shrink-0 mt-0.5" />
                        <span>
                          {audienceLabel(c.audience)}
                          <span className="block text-xs text-gray-500 dark:text-gray-300">{audienceSizeLabel(c)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3"><StatusBadge campaign={c} /></td>
                    <td className="px-4 py-3"><Delivery campaign={c} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-300 whitespace-nowrap">
                      <p>{date.day}</p>
                      <p className="text-xs">{date.label} às {date.time}</p>
                    </td>
                    {byEmail && (
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {c.matches?.map((m) => (
                            <li key={m.email} className="flex items-center gap-2 whitespace-nowrap">
                              <RecipientStatus status={m.status} />
                              <span className="text-xs text-gray-600 dark:text-gray-300">{m.email}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-4"
        />
      </main>

      {audienceOf && (
        <CampaignAudienceModal campaignId={audienceOf} onClose={() => setAudienceOf(null)} />
      )}
    </>
  );
}
