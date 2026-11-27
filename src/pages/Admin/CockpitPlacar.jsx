import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import CockpitNav from "../../components/CockpitNav";
import { Loading, Skeleton } from "../../components/Skeleton";
import CockpitService from "../../services/cockpit.service";
import { errorText } from "../../utils/apiError";
import { useToast } from "../../hooks/useToast";
import { BRICK, NOTE, PLACAR_STATUS, dayMonth, placarValue } from "../../utils/cockpit";

function Status({ kind }) {
  const s = PLACAR_STATUS[kind] || PLACAR_STATUS.sem_dados;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${s.tone}`}>
      <span aria-hidden="true">{s.symbol}</span> {s.label}
    </span>
  );
}

// Campo de meta vazio apaga a meta (null); número inválido ou negativo é ignorado pelo formulário
const toMeta = (text) => (text.trim() === "" ? null : Number(text.replace(",", ".")));

export default function CockpitPlacar() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [metas, setMetas] = useState({}); // texto digitado por número
  const [saving, setSaving] = useState(false);

  const load = (d) => {
    setData(d);
    setMetas(Object.fromEntries(d.numeros.map((n) => [n.key, n.meta === null ? "" : String(n.meta)])));
  };

  useEffect(() => {
    CockpitService.getPlacar()
      .then(load)
      .catch((err) => setError(errorText(err) || "Não foi possível carregar o placar"));
  }, []);

  const invalid = (n) => {
    const v = toMeta(metas[n.key] ?? "");
    return v !== null && (!Number.isFinite(v) || v < 0);
  };
  const changed = data ? data.numeros.filter((n) => toMeta(metas[n.key] ?? "") !== n.meta) : [];
  const hasInvalid = data ? data.numeros.some(invalid) : false;

  const save = async (e) => {
    e.preventDefault();
    if (!changed.length || hasInvalid) return;
    setSaving(true);
    try {
      await CockpitService.savePlacarMetas(Object.fromEntries(changed.map((n) => [n.key, toMeta(metas[n.key])])));
      load(await CockpitService.getPlacar());
      toast("Metas salvas", "success");
    } catch (err) {
      toast(errorText(err) || "Erro ao salvar as metas", "error");
    } finally {
      setSaving(false);
    }
  };

  const week = data?.weeks[data.weeks.length - 1];

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <CockpitNav />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target size={22} aria-hidden="true" /> Placar semanal</h1>
          <p className={`text-sm mt-1 ${NOTE}`}>
            Semana de segunda a domingo (horário de Brasília). Abaixo da meta = menos de 90%; na meta = de 90% a 110%; acima = mais de 110%.
            {week && ` Semana atual: ${dayMonth(week.start)} a ${dayMonth(week.end)}, ainda em andamento.`}
          </p>
        </div>

        {error && <p role="alert" className={`text-sm ${BRICK}`}>{error}</p>}

        {!data && !error && (
          <Loading label="Carregando o placar"><Skeleton className="h-96" rounded="rounded-xl" /></Loading>
        )}

        {data && (
          <form onSubmit={save} aria-label="Metas semanais" className="space-y-4">
            <div className="overflow-x-auto rounded-xl border bg-white dark:bg-gray-900">
              <table className="w-full text-sm">
                <caption className="sr-only">Números da semana atual contra a meta semanal</caption>
                <thead>
                  <tr className={`text-left text-xs ${NOTE}`}>
                    <th scope="col" className="p-3 font-medium">Número</th>
                    <th scope="col" className="p-3 font-medium text-right">Esta semana</th>
                    <th scope="col" className="p-3 font-medium text-right">Semana anterior</th>
                    <th scope="col" className="p-3 font-medium">Meta semanal</th>
                    <th scope="col" className="p-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {data.numeros.map((n) => (
                    <tr key={n.key}>
                      <th scope="row" className="p-3 text-left font-medium">{n.label}</th>
                      <td className="p-3 text-right tabular-nums font-semibold">{placarValue(n.current.value, n.unit)}</td>
                      <td className={`p-3 text-right tabular-nums ${NOTE}`}>{placarValue(n.previous?.value, n.unit)}</td>
                      <td className="p-3">
                        <label className="sr-only" htmlFor={`meta-${n.key}`}>Meta semanal de {n.label}</label>
                        <input
                          id={`meta-${n.key}`}
                          inputMode="decimal"
                          className="input w-28 tabular-nums"
                          placeholder="sem meta"
                          value={metas[n.key] ?? ""}
                          aria-invalid={invalid(n) || undefined}
                          onChange={(e) => setMetas({ ...metas, [n.key]: e.target.value })}
                        />
                      </td>
                      <td className="p-3"><Status kind={n.current.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasInvalid && <p role="alert" className={`text-sm ${BRICK}`}>Use só números, sem sinal de menos.</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving || !changed.length || hasInvalid} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar metas"}
              </button>
            </div>

            <section aria-label="Search Console" className="rounded-xl border border-dashed bg-white dark:bg-gray-900 p-4">
              <h2 className="font-semibold">Search Console: aguardando acesso</h2>
              <p className={`text-sm mt-1 ${NOTE}`}>
                Impressões, cliques e posição no Google entram aqui quando o acesso for liberado. Até lá, nenhum número é mostrado.
              </p>
              <p className={`text-sm mt-1 ${NOTE}`}>
                Pedidos de pré-diagnóstico por texto: o pedido sai pelo WhatsApp ou e-mail e não é guardado aqui. A origem aparece no GA4
                (evento pre_diagnostico_cta, parâmetro origin_path) e na mensagem recebida, na linha [ref: blog-...].
              </p>
            </section>

            <section aria-label="Últimas 13 semanas" className="space-y-2">
              <h2 className="font-semibold">Últimas 13 semanas</h2>
              {data.numeros.map((n) => (
                <details key={n.key} className="rounded-xl border bg-white dark:bg-gray-900 p-4">
                  <summary className="cursor-pointer font-medium">{n.label}</summary>
                  <table className="w-full text-sm mt-3">
                    <caption className="sr-only">{n.label}, semana a semana</caption>
                    <thead>
                      <tr className={`text-left text-xs ${NOTE}`}>
                        <th scope="col" className="py-1 font-medium">Semana</th>
                        <th scope="col" className="py-1 font-medium text-right">Valor</th>
                        <th scope="col" className="py-1 pl-4 font-medium">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                      {[...n.serie].reverse().map((w) => (
                        <tr key={w.week}>
                          <td className="py-1 tabular-nums">{dayMonth(w.start)} a {dayMonth(w.end)}{w.current ? " (atual)" : ""}</td>
                          <td className="py-1 text-right tabular-nums">{placarValue(w.value, n.unit)}</td>
                          <td className="py-1 pl-4"><Status kind={w.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </section>
          </form>
        )}
      </main>
    </>
  );
}
