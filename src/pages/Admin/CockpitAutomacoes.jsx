import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import CockpitNav from "../../components/CockpitNav";
import { Loading, Skeleton } from "../../components/Skeleton";
import CockpitService from "../../services/cockpit.service";
import { errorText } from "../../utils/apiError";
import { AUTOMACAO_STATUS, BRICK, NOTE, duration, num, timeAgo } from "../../utils/cockpit";

const RUN_STATUS = { ok: "OK", fail: "Falhou", start: "Iniciada" };
const fmtDate = (d) => (d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

function every(sec) {
  if (sec % 86400 === 0) return `${sec / 86400} d`;
  if (sec % 3600 === 0) return `${sec / 3600} h`;
  return `${Math.round(sec / 60)} min`;
}

function Rotina({ job }) {
  const s = AUTOMACAO_STATUS[job.status] || AUTOMACAO_STATUS.nunca_rodou;
  return (
    <article aria-label={job.label} className="rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{job.label} <span className={`font-mono text-xs font-normal ${NOTE}`}>{job.job}</span></h2>
        <span className={`inline-flex items-center gap-1 font-semibold ${s.tone}`}>
          <span aria-hidden="true">{s.symbol}</span> {s.label}
        </span>
      </header>
      <p className={`text-sm ${NOTE}`}>
        Esperado a cada {every(job.expectedEverySec)} (folga de {every(job.graceSec || 60)}).{" "}
        {job.neverRan ? "Ainda não deu sinal de vida." : `Último sinal ${timeAgo(job.lastRunAt)}.`}
      </p>
      {job.lastError && <p className={`text-sm font-medium ${BRICK}`}>Erro: {job.lastError}</p>}
      {job.runs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Últimas execuções de {job.label}</caption>
            <thead>
              <tr className={`text-left text-xs ${NOTE}`}>
                <th scope="col" className="py-1 pr-3 font-medium">Início</th>
                <th scope="col" className="py-1 pr-3 font-medium">Resultado</th>
                <th scope="col" className="py-1 pr-3 font-medium text-right">Duração</th>
                <th scope="col" className="py-1 font-medium text-right">Itens</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {job.runs.map((r, i) => (
                <tr key={`${r.startedAt}-${i}`}>
                  <td className="py-1 pr-3 tabular-nums">{fmtDate(r.startedAt)}</td>
                  <td className={`py-1 pr-3 ${r.status === "fail" ? `font-semibold ${BRICK}` : ""}`}>
                    <span aria-hidden="true">{r.status === "fail" ? "✕ " : r.status === "ok" ? "✓ " : "… "}</span>
                    {RUN_STATUS[r.status] || r.status}
                    {r.error && <span className="block text-xs font-normal">{r.error}</span>}
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">{duration(r.durationMs)}</td>
                  <td className="py-1 text-right tabular-nums">{num(r.items)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default function CockpitAutomacoes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    CockpitService.getAutomacoes()
      .then(setData)
      .catch((err) => setError(errorText(err) || "Não foi possível carregar as automações"));
  }, []);

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <CockpitNav />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={22} aria-hidden="true" /> Automações</h1>
          <p className={`text-sm mt-1 ${NOTE}`}>
            Rotinas que rodam sozinhas. Atrasada = silêncio além do esperado mais a folga. Falha ou atraso também aparece em Hoje.
          </p>
        </div>

        {error && <p role="alert" className={`text-sm ${BRICK}`}>{error}</p>}

        {!data && !error && (
          <Loading label="Carregando as automações" className="grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48" rounded="rounded-xl" />)}
          </Loading>
        )}

        {data && <div className="grid gap-5 md:grid-cols-2">{data.jobs.map((j) => <Rotina key={j.job} job={j} />)}</div>}
      </main>
    </>
  );
}
