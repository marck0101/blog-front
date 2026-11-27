import { useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { trackEvent } from "../../utils/analytics";
import { SERVICES_INTRO, SERVICES_TITLE, servicesForCluster } from "../../utils/clusterServices";

// trackEvent já respeita o consentimento (analyticsAllowed / fila pendingGA)
function useServiceClick() {
  const { pathname } = useLocation();
  return (slug) => () => trackEvent("service_click", { item_id: slug, origin_path: pathname });
}

// Bloco da página de tema (/temas/:slug)
export function ClusterServices({ clusterSlug }) {
  const onClick = useServiceClick();
  const services = servicesForCluster(clusterSlug);
  if (services.length === 0) return null;
  return (
    <section aria-labelledby="servicos" className="mt-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5">
      <h2 id="servicos" className="text-xl font-bold text-gray-900 dark:text-gray-100">{SERVICES_TITLE}</h2>
      <p className="mt-2 text-gray-700 dark:text-gray-300">{SERVICES_INTRO}</p>
      <ul className="mt-3 space-y-2">
        {services.map((s) => (
          <li key={s.slug}>
            <a href={s.url} onClick={onClick(s.slug)} className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {s.name} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Link único e compacto no fim do post (primeiro serviço do tema)
export function PostServiceLink({ clusterSlug }) {
  const onClick = useServiceClick();
  const [service] = servicesForCluster(clusterSlug);
  if (!service) return null;
  return (
    <p className="mt-8 text-sm text-gray-700 dark:text-gray-300">
      Serviço relacionado:{" "}
      <a href={service.url} onClick={onClick(service.slug)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
        {service.name}
      </a>
    </p>
  );
}
