import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "../../utils/analytics";
import useExperiment from "../../hooks/useExperiment";
import { originPath, preDiagnosticoLink } from "../../utils/preOrigin";

/** CTA compacto para o pré-diagnóstico gratuito (home e fim dos posts). */
export default function PreDiagnosticoCard({ location = "card", className = "mt-12" }) {
  // Experimento "pre-diagnostico-cta": só o texto do botão muda (mesmo elemento, sem salto de layout).
  // Sem experimento, sem consentimento ou com a API fora do ar, vale o texto padrão.
  const { texto, params } = useExperiment("pre-diagnostico-cta");
  // R4: a página de onde o clique saiu viaja no link (só /blog ou /blog/<slug>) e no evento
  const { pathname } = useLocation();
  const origin = originPath(pathname);
  return (
    <aside
      aria-label="Pré-diagnóstico gratuito"
      className={`skin-card rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 ${className}`}
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pré-diagnóstico gratuito</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Eu analiso seu site e seu Google e te mando um relatório curto em PDF. Sem custo e sem compromisso.
        </p>
      </div>
      <Link
        to={preDiagnosticoLink(pathname)}
        onClick={() => trackEvent("pre_diagnostico_card_click", { link_location: location, ...(origin ? { origin_path: origin } : {}), ...params })}
        className="mt-4 sm:mt-0 shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 transition"
      >
        {texto || "Quero o meu"}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
