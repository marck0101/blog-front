import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ScrollText } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import Pagination from "../../components/Pagination";
import DateRangePicker from "../../components/DateRangePicker";
import EmptyState from "../../components/EmptyState";
import AuditService from "../../services/audit.service";
import { AUDIT_ACTIONS, actionLabel, formatAuditDate, metaItems, targetHref } from "../../utils/audit";
import { errorText } from "../../utils/apiError";

const LIMIT = 20;

function Who({ entry }) {
  const email = entry.actor?.email;
  if (email) return <span className="break-all">{email}</span>;
  return <span className="text-gray-400">Ninguém identificado</span>;
}

function Target({ entry }) {
  const { type, label } = entry.target || {};
  const href = targetHref(entry);
  if (href) {
    return (
      <Link to={href} className="text-blue-600 dark:text-blue-400 hover:underline break-all">
        {label}
      </Link>
    );
  }
  if (label) return <span className="break-words">{label}</span>;
  return <span className="text-gray-400">{type === "subscriber" ? "Assinante (só o id)" : "—"}</span>;
}

function Meta({ meta }) {
  const items = metaItems(meta);
  if (items.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1 mt-1">
      {items.map((m) => (
        <span key={m.key} className="text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5">
          {m.text}
        </span>
      ))}
    </span>
  );
}

// Registro de ações do admin (SEC-09): quem fez o quê e quando. Só leitura.
export default function Audit() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      AuditService.list({ page, limit: LIMIT, action, from, to })
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((err) => {
          setData(null);
          setError(errorText(err) || "Não foi possível carregar o registro.");
        }),
    [page, action, from, to]
  );

  useEffect(() => {
    load();
  }, [load]);

  const hasFilter = Boolean(action || from || to);
  const clear = () => {
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  };
  const entries = data?.entries || [];

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ScrollText size={22} /> Auditoria</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            Quem fez o quê no painel e quando. O registro guarda a ação, nunca o conteúdo, e some sozinho depois de 365 dias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            name="action"
            aria-label="Filtrar por ação"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="input !w-auto max-w-full"
          >
            <option value="">Todas as ações</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <DateRangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
              setPage(1);
            }}
          />
          {hasFilter && (
            <button type="button" onClick={clear} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Limpar filtros
            </button>
          )}
          {data && <span className="text-sm text-gray-500 dark:text-gray-300 sm:ml-auto">{data.total} registro(s)</span>}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 flex flex-wrap items-center gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => { setError(""); load(); }} className="ml-auto px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 font-medium hover:bg-red-100 dark:hover:bg-red-900/30">
              Tentar de novo
            </button>
          </div>
        )}

        {!data && !error && <p className="text-sm text-gray-500 dark:text-gray-300">Carregando...</p>}

        {data && entries.length === 0 && (
          <EmptyState
            title={hasFilter ? "Nada neste filtro" : "Nenhuma ação registrada ainda"}
            description={hasFilter ? "Nenhuma ação encontrada com esses filtros." : "As ações do painel aparecem aqui assim que acontecerem."}
            actionLabel={hasFilter ? "Limpar filtros" : undefined}
            onAction={hasFilter ? clear : undefined}
          />
        )}

        {entries.length > 0 && (
          <>
            {/* Telas largas: tabela */}
            <div className={`hidden md:block rounded-xl border bg-white dark:bg-gray-900 overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 dark:text-gray-300 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Data (Brasília)</th>
                    <th className="px-4 py-3 font-medium">Ação</th>
                    <th className="px-4 py-3 font-medium">Quem</th>
                    <th className="px-4 py-3 font-medium">Alvo</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e._id || `${e.at}-${e.action}`} className="border-b last:border-b-0 align-top">
                      <td className="px-4 py-3 whitespace-nowrap">{formatAuditDate(e.at)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{actionLabel(e.action)}</span>
                        <Meta meta={e.meta} />
                      </td>
                      <td className="px-4 py-3"><Who entry={e} /></td>
                      <td className="px-4 py-3"><Target entry={e} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Celular: cartões */}
            <ul className={`md:hidden space-y-3`}>
              {entries.map((e) => (
                <li key={e._id || `${e.at}-${e.action}`} className="rounded-xl border bg-white dark:bg-gray-900 p-4 text-sm space-y-1">
                  <p className="font-medium">{actionLabel(e.action)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{formatAuditDate(e.at)}</p>
                  <p><span className="text-gray-500 dark:text-gray-300">Quem: </span><Who entry={e} /></p>
                  <p><span className="text-gray-500 dark:text-gray-300">Alvo: </span><Target entry={e} /></p>
                  <Meta meta={e.meta} />
                </li>
              ))}
            </ul>

            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </main>
    </>
  );
}
