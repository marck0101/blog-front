import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import BarList from "../../components/BarList";
import FilterChips from "../../components/FilterChips";
import MetricsService from "../../services/metrics.service";
import { formatRate, shortUrl } from "../../utils/metrics";
import { SHARE_CHANNELS } from "../../utils/share";

const PERIODS = [
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "365", label: "12 meses" },
];

const LOCATION_LABELS = { home: "Página inicial", post: "Dentro de um post", "sem registro": "Sem registro" };

function Tile({ label, value, detail }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-300">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums mt-1">{value}</p>
      {detail && <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{detail}</p>}
    </div>
  );
}

function Card({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-4 ${className}`}>
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// Novos assinantes por semana: uma série, valor no hover e na tabela abaixo
function WeeklyBars({ weekly }) {
  if (!weekly.length) return <p className="text-sm text-gray-400">Sem inscrições no período.</p>;
  const max = Math.max(...weekly.map((w) => w.new), 1);
  const label = (w) => new Date(w.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div>
      {/* Linha de referência no topo: dá escala ao gráfico sem eixo completo */}
      <div className="relative">
        <span className="absolute -top-2 left-0 text-[10px] text-gray-400 tabular-nums bg-white dark:bg-gray-900 pr-1">{max}</span>
        <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />
      </div>
      <div className="flex items-end gap-1 h-32 border-b border-gray-200 dark:border-gray-700" role="img" aria-label="Novos assinantes por semana">
        {weekly.map((w) => (
          <div key={w.week} className="group relative flex-1 h-full flex flex-col items-center justify-end">
            {/* Valor em cima da barra (some quando há semanas demais para caber) */}
            {w.new > 0 && weekly.length <= 16 && (
              <span className="text-[10px] leading-3 mb-0.5 text-gray-600 dark:text-gray-300 tabular-nums">{w.new}</span>
            )}
            <div
              className="w-full max-w-8 rounded-t bg-blue-600 dark:bg-blue-500 group-hover:bg-blue-700 dark:group-hover:bg-blue-400 transition-colors"
              style={{ height: `${Math.max((w.new / max) * 85, w.new ? 4 : 0)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 shadow z-10">
              Semana de {label(w)}: {w.new} novo(s)
              {w.unsubscribed > 0 && `, ${w.unsubscribed} saída(s)`}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {weekly.map((w, i) => (
          <span key={w.week} className="flex-1 text-center text-[10px] text-gray-400 tabular-nums">
            {i === 0 || i === weekly.length - 1 || weekly.length <= 8 ? label(w) : ""}
          </span>
        ))}
      </div>
      <details className="mt-2 text-xs text-gray-500 dark:text-gray-300">
        <summary className="cursor-pointer">Ver em tabela</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left"><th className="py-1">Semana</th><th>Novos</th><th>Saídas</th></tr>
          </thead>
          <tbody>
            {weekly.map((w) => (
              <tr key={w.week} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-1">{label(w)}</td><td>{w.new}</td><td>{w.unsubscribed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// Favoritos, compartilhamentos e comentários dos leitores no período
function Engagement({ data }) {
  const channelItems = (list) =>
    list.map((c) => ({ key: c.channel, label: SHARE_CHANNELS[c.channel] || c.channel, value: c.count }));
  const netFavorites = data.totals.favorites - data.totals.unfavorites;

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Engajamento nos posts</h2>
        <p className="text-xs text-gray-500 dark:text-gray-300">
          Contagem anônima a partir desta versão do blog: favoritos ficam no navegador do leitor e só o +1/-1 chega aqui.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Favoritados"
          value={data.totals.favorites.toLocaleString("pt-BR")}
          detail={`${data.totals.unfavorites} removido(s) · saldo ${netFavorites > 0 ? "+" : ""}${netFavorites}`}
        />
        <Tile label="Compartilhamentos" value={data.totals.shares.toLocaleString("pt-BR")} detail="Cliques nos botões de compartilhar" />
        <Tile
          label="Visitas por compartilhamento"
          value={data.totals.shareVisits.toLocaleString("pt-BR")}
          detail={data.totals.shares > 0 ? `${(data.totals.shareVisits / data.totals.shares).toFixed(1)} visita(s) por compartilhamento` : "Quem abriu um link compartilhado"}
        />
        <Tile
          label="Comentários"
          value={data.comments.total.toLocaleString("pt-BR")}
          detail={
            <>
              {data.comments.approved} aprovado(s) ·{" "}
              <Link to="/admin/comments" className="underline">{data.comments.pending} pendente(s)</Link>
            </>
          }
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Compartilhado por canal" subtitle="Botão usado no post">
          <BarList items={channelItems(data.sharesByChannel)} empty="Nenhum compartilhamento no período." />
        </Card>
        <Card title="Visitas por canal" subtitle="Quem chegou por um link compartilhado (utm_medium=share)">
          <BarList items={channelItems(data.visitsByChannel)} empty="Nenhuma visita por compartilhamento no período." />
        </Card>
        <Card title="Posts com mais engajamento" subtitle="Favoritos + compartilhamentos + visitas por compartilhamento">
          <BarList
            showDetail
            items={data.posts
              .filter((p) => p.favorites + p.shares + p.shareVisits > 0)
              .slice(0, 8)
              .map((p) => ({
                key: String(p.id),
                label: p.title,
                value: p.favorites + p.shares + p.shareVisits,
                href: `/blog/${p.slug}`,
                detail: `${p.favorites} favorito(s) · ${p.shares} compartilhamento(s) · ${p.shareVisits} visita(s) · ${p.comments} comentário(s)`,
              }))}
            empty="Nenhum engajamento no período."
          />
        </Card>
      </div>
    </>
  );
}

export default function Metrics() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    MetricsService.overview(Number(days))
      .then((d) => active && (setData(d), setError(null)))
      .catch(() => active && setError("Erro ao carregar métricas."));
    MetricsService.engagement(Number(days))
      .then((d) => active && setEngagement(d))
      .catch(() => active && setEngagement(null));
    return () => {
      active = false;
    };
  }, [days]);

  const signed = (n) => (n > 0 ? `+${n}` : String(n));

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Métricas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Assinantes, emails e o engajamento dos leitores com os posts.</p>
          </div>
          <FilterChips options={PERIODS} selected={days} onChange={setDays} multiSelect={false} showAll={false} />
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && <p className="text-gray-400">Carregando...</p>}

        {data && (
          <>
            {/* AUDIÊNCIA */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label="Assinantes ativos" value={data.audience.active.toLocaleString("pt-BR")} detail={`${data.audience.members} membro(s)`} />
              <Tile
                label="Novos no período"
                value={data.audience.newSubscribers.toLocaleString("pt-BR")}
                detail={`Saldo ${signed(data.audience.netGrowth)} (${formatRate(data.audience.growthRate)})`}
              />
              <Tile
                label="Cancelamentos"
                value={data.audience.unsubscribed.toLocaleString("pt-BR")}
                detail={`${formatRate(data.audience.churnRate)} da base`}
              />
              <Tile
                label="Abertura média"
                value={formatRate(data.email.openRate)}
                detail={`Clique ${formatRate(data.email.clickRate)} · ${data.email.campaigns} envio(s)`}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Novos assinantes por semana">
                <WeeklyBars weekly={data.audience.weekly} />
              </Card>

              <Card title="De onde vêm os novos assinantes" subtitle="Canal da visita em que a pessoa se inscreveu">
                <BarList items={data.sources.byChannel.map((c) => ({ key: c.key, label: c.key, value: c.count }))} />
                {data.sources.byChannel.some((c) => c.key === "Sem registro") && (
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    "Sem registro" = inscrições anteriores à captura de origem.
                  </p>
                )}
              </Card>

              <Card title="Posts que mais geram assinantes" subtitle="Inscrições feitas dentro do post · barra = fatia do total de inscrições em posts">
                <BarList
                  scale="total"
                  showDetail
                  formatValue={(v) => `${v.toLocaleString("pt-BR")} inscriç${v === 1 ? "ão" : "ões"}`}
                  items={data.sources.byPost.map((p) => ({
                    key: p.slug,
                    label: p.title,
                    value: p.signups,
                    href: `/blog/${p.slug}`,
                    detail:
                      p.conversionRate !== null
                        ? `Conversão ${formatRate(p.conversionRate, 2)} · ${p.views.toLocaleString("pt-BR")} visualizações`
                        : "Sem visualizações registradas",
                  }))}
                  empty="Nenhuma inscrição dentro de posts no período."
                />
              </Card>

              <Card title="Onde a pessoa se inscreveu">
                <BarList
                  items={data.sources.byLocation.map((l) => ({
                    key: l.key,
                    label: LOCATION_LABELS[l.key] || l.key,
                    value: l.count,
                  }))}
                />
                {data.sources.byUtmCampaign.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Campanhas (utm_campaign)</p>
                    <BarList items={data.sources.byUtmCampaign.map((c) => ({ key: c.key, label: c.key, value: c.count }))} />
                  </>
                )}
              </Card>
            </div>

            {/* EMAIL */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label="Emails entregues" value={data.email.delivered.toLocaleString("pt-BR")} detail={`${data.email.campaigns} envio(s) com rastreio`} />
              <Tile label="Abertura" value={formatRate(data.email.openRate)} detail={`${data.email.opened} abertura(s) únicas`} />
              <Tile label="Clique" value={formatRate(data.email.clickRate)} detail={`CTOR ${formatRate(data.email.clickToOpenRate)}`} />
              <Tile label="Cancelamento por email" value={formatRate(data.email.unsubscribeRate, 2)} detail={`${data.email.unsubscribed} saída(s) pelo link`} />
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <Card title="Desempenho por envio" className="lg:col-span-2">
                {data.email.perCampaign.length === 0 ? (
                  <p className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    Nenhum envio com rastreio no período. As taxas começam a aparecer a partir do próximo envio.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                          <th className="px-5 py-2 font-semibold">Envio</th>
                          <th className="px-3 py-2 font-semibold text-right">Entregues</th>
                          <th className="px-3 py-2 font-semibold text-right">Abertura</th>
                          <th className="px-3 py-2 font-semibold text-right">Clique</th>
                          <th className="px-5 py-2 font-semibold text-right">Saídas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.email.perCampaign.map((c) => (
                          <tr key={c._id} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-5 py-2">
                              <Link to={`/admin/campaigns/${c._id}`} className="text-gray-900 dark:text-gray-100 hover:underline">
                                {c.subject}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-300">
                                {new Date(c.startedAt).toLocaleDateString("pt-BR")}
                                {c.kind === "post-notification" && " · aviso de post"}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{c.delivered}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatRate(c.openRate)}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatRate(c.clickRate)}</td>
                            <td className="px-5 py-2 text-right tabular-nums">{c.unsubscribed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Links mais clicados" subtitle="Pessoas únicas, todos os envios do período">
                <BarList
                  items={data.email.topLinks.map((l) => ({
                    key: l.url,
                    label: shortUrl(l.url),
                    value: l.uniqueClicks,
                    href: l.url,
                    detail: `${l.clicks} clique(s) no total`,
                  }))}
                  empty="Nenhum clique no período."
                />
              </Card>
            </div>

            {engagement && <Engagement data={engagement} />}

            <p className="text-xs text-gray-500 dark:text-gray-300">
              Abertura depende de imagens carregadas (Apple Mail pode marcar sozinho; quem bloqueia imagens só conta
              ao clicar). Acessos de robôs e antivírus de email ficam fora das taxas. Visitas ao blog vindas dos
              emails e do LinkedIn aparecem no GA4 pelas UTMs (newsletter / email e linkedin / social).
            </p>
          </>
        )}
      </main>
    </>
  );
}
