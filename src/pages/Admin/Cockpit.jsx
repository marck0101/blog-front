import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BookOpen, CircleAlert, Gauge, Handshake, Users, Wallet } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import CockpitNav from "../../components/CockpitNav";
import { Loading, Skeleton } from "../../components/Skeleton";
import CockpitService from "../../services/cockpit.service";
import { errorText } from "../../utils/apiError";
import { JOB_STATUS, PACING_STATUS, brl, isStale, num, sourceLine, timeAgo } from "../../utils/cockpit";

// Status sempre com texto e símbolo; a cor só reforça
const TONE = {
  no_caminho: "text-green-700 dark:text-green-300",
  atencao: "text-amber-700 dark:text-amber-300",
  fora: "text-red-700 dark:text-red-300",
  sem_dados: "text-gray-500 dark:text-gray-400",
  ok: "text-green-700 dark:text-green-300",
  rodando: "text-blue-700 dark:text-blue-300",
  atrasada: "text-amber-700 dark:text-amber-300",
  falhou: "text-red-700 dark:text-red-300",
};

// Cartão da página Hoje: título, conteúdo e a linha "fonte · atualizado há X".
// Retrato velho (mais de 2× o esperado) fica acinzentado e avisa em texto.
export function Tile({ title, icon: Icon, tile, wide = false, children }) {
  const stale = isStale(tile);
  return (
    <article
      aria-label={title}
      data-stale={stale ? "true" : undefined}
      className={`rounded-xl border bg-white dark:bg-gray-900 p-5 flex flex-col gap-3 ${wide ? "md:col-span-2 lg:col-span-3" : ""} ${stale ? "opacity-60 grayscale" : ""}`}
    >
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
        <Icon size={16} aria-hidden="true" /> {title}
      </h2>
      <div className="flex-1 space-y-2">{children}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {sourceLine(tile)}
        {stale && <strong className="ml-1">· desatualizado</strong>}
      </p>
    </article>
  );
}

function Status({ kind, map }) {
  const s = map[kind] || map.sem_dados;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${TONE[kind] || TONE.sem_dados}`}>
      <span aria-hidden="true">{s.symbol}</span> {s.label}
    </span>
  );
}

const Big = ({ children }) => <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{children}</p>;
const NoData = ({ children = "Sem dados" }) => <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;

function Receita({ data }) {
  const has = data.status !== "sem_dados";
  return (
    <Tile title="Receita do mês" icon={Wallet} tile={data}>
      {data.accumulated === null ? <NoData>Sem dados de receita neste mês</NoData> : <Big>{brl(data.accumulated)}</Big>}
      <p><Status kind={data.status} map={PACING_STATUS} /></p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500 dark:text-gray-400">Meta</dt>
        <dd className="text-right tabular-nums">{brl(data.meta)}</dd>
        <dt className="text-gray-500 dark:text-gray-400">Esperado até hoje</dt>
        <dd className="text-right tabular-nums">{brl(data.expected)}</dd>
        <dt className="text-gray-500 dark:text-gray-400">% do esperado</dt>
        <dd className="text-right tabular-nums">{has && data.pctOfExpected !== null ? `${data.pctOfExpected.toLocaleString("pt-BR")}%` : "—"}</dd>
        <dt className="text-gray-500 dark:text-gray-400">Projeção do mês</dt>
        <dd className="text-right tabular-nums">{brl(data.projection)}</dd>
      </dl>
    </Tile>
  );
}

function Prospeccao({ data }) {
  return (
    <Tile title="Prospecção da semana" icon={Handshake} tile={data}>
      {!data.hasData ? (
        <NoData>Sem dados de prospecção</NoData>
      ) : (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[["Contatos", data.contatos], ["Respostas", data.respostas], ["Reuniões", data.reunioes]].map(([label, value]) => (
            <div key={label}>
              <dd className="text-2xl font-bold tabular-nums">{num(value)}</dd>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
            </div>
          ))}
        </dl>
      )}
    </Tile>
  );
}

function Leituras({ data }) {
  const v = data.variacaoPct;
  const trend = v === null ? "sem base de comparação" : v > 0 ? `▲ ${v.toLocaleString("pt-BR")}% a mais` : v < 0 ? `▼ ${Math.abs(v).toLocaleString("pt-BR")}% a menos` : "= igual";
  return (
    <Tile title="Leituras do blog (7 dias)" icon={BookOpen} tile={data}>
      <Big>{num(data.views7d)}</Big>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {trend} que os 7 dias anteriores ({num(data.viewsPrev7d)})
      </p>
    </Tile>
  );
}

function Inscritos({ data }) {
  return (
    <Tile title="Inscritos" icon={Users} tile={data}>
      <Big>{num(data.ativos)}</Big>
      <p className="text-sm text-gray-600 dark:text-gray-300">ativos · {num(data.novosMes)} novos neste mês</p>
    </Tile>
  );
}

function Automacoes({ data }) {
  return (
    <Tile title="Automações" icon={Activity} tile={data} wide>
      <p className="text-sm font-medium flex flex-wrap gap-x-4 gap-y-1">
        <span className={TONE.ok}>✓ {data.ok} OK</span>
        <span className={TONE.atrasada}>▲ {data.atrasada} atrasada(s)</span>
        <span className={TONE.falhou}>✕ {data.falhou} falhou</span>
        {data.rodando > 0 && <span className={TONE.rodando}>… {data.rodando} rodando</span>}
      </p>
      <ul className="divide-y dark:divide-gray-800 text-sm">
        {data.jobs.map((j) => (
          <li key={j.job} className="py-1.5 flex flex-wrap items-center justify-between gap-x-3">
            <span className="font-medium">{j.label}</span>
            <span className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{j.neverRan ? "sem sinal ainda" : `último sinal ${timeAgo(j.lastRunAt)}`}</span>
              <Status kind={j.status} map={JOB_STATUS} />
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}

function Acoes({ data }) {
  const items = data.items;
  return (
    <Tile title="Precisa de ação" icon={CircleAlert} tile={data}>
      {items.length === 0 ? (
        <p className="text-sm text-green-700 dark:text-green-300">✓ Nada pendente</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id}>
              <p className="font-semibold text-red-700 dark:text-red-300"><span aria-hidden="true">✕</span> {i.title}</p>
              <p className="text-gray-600 dark:text-gray-300">{i.detail}</p>
              {i.id === "experimentos-vencidos" && (
                <Link to="/admin/cockpit/experimentos" className="text-blue-700 dark:text-blue-300 hover:underline">Ver experimentos</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

export default function Cockpit() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    CockpitService.getHoje()
      .then(setData)
      .catch((err) => setError(errorText(err) || "Não foi possível carregar o Cockpit"));
  }, []);

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <CockpitNav />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gauge size={22} aria-hidden="true" /> Hoje</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            O que importa agora. Cada número diz de onde veio e há quanto tempo.
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {!data && !error && (
          <Loading label="Carregando o Cockpit" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40" rounded="rounded-xl" />)}
          </Loading>
        )}

        {data && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Receita data={data.receita} />
            <Prospeccao data={data.prospeccao} />
            <Acoes data={data.acoes} />
            <Leituras data={data.leituras} />
            <Inscritos data={data.inscritos} />
            <Automacoes data={data.automacoes} />
          </div>
        )}
      </main>
    </>
  );
}
