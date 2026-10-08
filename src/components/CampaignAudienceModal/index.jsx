import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, X } from "lucide-react";
import RecipientsTable from "../RecipientsTable";
import CampaignService from "../../services/campaign.service";
import { audienceLabel, audienceToApi } from "../../utils/campaignAudience";

// Rascunho ainda não tem destinatários fixados: mostra quem receberia hoje
function DraftAudience({ campaign }) {
  const [preview, setPreview] = useState(null);
  const selected = campaign.audience?.type === "selected" ? campaign.audience.subscribers || [] : null;

  useEffect(() => {
    if (selected) return;
    CampaignService.audiencePreview(audienceToApi(campaign.audience))
      .then(setPreview)
      .catch(() => setPreview({ count: 0, sample: [] }));
  }, [campaign]); // eslint-disable-line react-hooks/exhaustive-deps

  const people = selected ?? preview?.sample ?? [];
  const total = selected ? selected.length : preview?.count;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Rascunho: a lista final é fixada no momento do envio.{" "}
        {total !== undefined && `${total} destinatário${total !== 1 ? "s" : ""} hoje.`}
      </p>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border dark:border-gray-800">
        {people.map((s) => (
          <li key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm">
            {s.tier === "member" && <Crown size={13} className="text-amber-500" />}
            <span className="text-gray-900 dark:text-gray-100">{s.email}</span>
            {s.name && <span className="text-gray-500 dark:text-gray-300">· {s.name}</span>}
          </li>
        ))}
      </ul>
      {!selected && preview && preview.count > people.length && (
        <p className="text-xs text-gray-500 dark:text-gray-300">e mais {preview.count - people.length}</p>
      )}
    </div>
  );
}

/** Modal com o público de um envio e o status de cada destinatário */
export default function CampaignAudienceModal({ campaignId, onClose }) {
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    CampaignService.getById(campaignId)
      .then(setCampaign)
      .catch(() => setError("Não foi possível carregar o público deste envio."));
  }, [campaignId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-950 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {campaign?.subject ?? "Carregando..."}
            </h2>
            {campaign && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                {audienceLabel(campaign.audience)}
                {campaign.status !== "draft" &&
                  ` · ${campaign.stats.sent} entregue(s), ${campaign.stats.failed} falha(s)`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {campaign && campaign.status === "draft" && <DraftAudience campaign={campaign} />}
          {campaign && campaign.status !== "draft" && <RecipientsTable campaign={campaign} />}
          {campaign && (
            <Link
              to={`/admin/campaigns/${campaign._id}`}
              className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Abrir envio completo →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
