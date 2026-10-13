import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import BarList from "../BarList";
import MetricsService from "../../services/metrics.service";
import { formatRate, shortUrl } from "../../utils/metrics";

function Tile({ label, value, detail }) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
      {detail && <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{detail}</p>}
    </div>
  );
}

/** Engajamento de um envio já disparado: aberturas, cliques, links e saídas */
export default function CampaignMetrics({ campaign }) {
  const [detail, setDetail] = useState(null);
  const { stats } = campaign;

  useEffect(() => {
    if (!campaign.tracking) return;
    MetricsService.campaign(campaign._id).then(setDetail).catch(() => setDetail({ links: [], automated: 0 }));
  }, [campaign._id, campaign.tracking, stats.opened, stats.clicked]);

  if (!campaign.tracking) {
    return (
      <p className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-300 rounded-xl border bg-white dark:bg-gray-900 p-4">
        <Info size={16} className="shrink-0 mt-0.5" />
        Este envio saiu antes do rastreio de aberturas e cliques, por isso não tem taxas.
      </p>
    );
  }

  const people = (n) => `${n} pessoa${n !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Abertura" value={formatRate(stats.openRate)} detail={people(stats.opened)} />
        <Tile label="Clique" value={formatRate(stats.clickRate)} detail={people(stats.clicked)} />
        <Tile label="Clique de quem abriu" value={formatRate(stats.clickToOpenRate)} detail="CTOR" />
        <Tile label="Cancelamentos" value={formatRate(stats.unsubscribeRate)} detail={people(stats.unsubscribed)} />
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cliques por link</p>
        {detail ? (
          <BarList
            items={detail.links.map((l) => ({
              key: l.url,
              label: shortUrl(l.url),
              value: l.uniqueClicks,
              href: l.url,
              detail: `${people(l.uniqueClicks)} · ${l.clicks} clique${l.clicks !== 1 ? "s" : ""} no total`,
            }))}
            empty="Nenhum clique ainda."
          />
        ) : (
          <p className="text-sm text-gray-400">Carregando...</p>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-300">
        Taxas sobre os {stats.sent} entregues. Abertura depende de imagens carregadas: quem bloqueia imagens só
        aparece se clicar, e o Apple Mail pode marcar abertura sozinho. Por isso o clique é o número mais
        confiável.
        {detail?.automated > 0 &&
          ` ${detail.automated} acesso(s) de robôs ou antivírus de email foram descartados das taxas.`}
      </p>
    </div>
  );
}
