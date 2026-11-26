import { useEffect, useState } from "react";
import ClustersService from "../../services/clusters.service";

/**
 * ClusterFields — tema (cluster) opcional do post e a marca de artigo
 * principal (pilar). Um pilar por tema: marcar este tira a marca do pilar
 * anterior do mesmo tema (R-CLU-02 no backend). "Sem tema" grava null.
 */
export default function ClusterFields({ cluster, isPillar, onChange }) {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    ClustersService.getAll().then(setClusters).catch(() => {});
  }, []);

  if (clusters.length === 0) return null;
  const current = clusters.find((c) => c.slug === cluster);

  return (
    <div className="space-y-2">
      <label htmlFor="cluster" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tema <span className="font-normal text-gray-400">(opcional)</span>
      </label>
      <select
        id="cluster"
        name="cluster"
        className="input w-full"
        value={cluster || ""}
        // Sem tema não há pilar
        onChange={(e) => onChange({ cluster: e.target.value, isPillar: e.target.value ? isPillar : false })}
      >
        <option value="">Sem tema</option>
        {clusters.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.title}
          </option>
        ))}
      </select>
      {current && (
        <p className="text-xs text-gray-500 dark:text-gray-300">{current.description}</p>
      )}
      {cluster && (
        <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(isPillar)}
            onChange={(e) => onChange({ cluster, isPillar: e.target.checked })}
          />
          <span>
            Artigo principal do tema
            <span className="block text-xs text-gray-500 dark:text-gray-300">
              Aparece em destaque na página do tema e em todos os posts dele. Só um por tema.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
