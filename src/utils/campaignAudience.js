export const AUDIENCE_LABELS = {
  "post-category": "Categoria do post",
  members: "Membros",
  all: "Todos os assinantes",
  categories: "Por categorias",
  selected: "Assinantes específicos",
};

export const AUDIENCE_HINTS = {
  members: "Só assinantes ativos marcados como membro.",
  all: "Todos os assinantes ativos, membros ou não.",
  categories: "Assinantes ativos que seguem ao menos uma das categorias.",
  selected: "Apenas as pessoas que você escolher abaixo.",
};

export const emptyAudience = (type = "members") => ({
  type,
  categories: [],
  subscribers: [],
  excludeMembers: false,
});

/**
 * Público da tela (subscribers como objetos) → formato da API.
 * Com postCategory, "post-category" vira as categorias do post (prévia/contagem);
 * sem ele, mantém "post-category" (salvo no post e resolvido ao publicar).
 */
export function audienceToApi(value, postCategory) {
  const excludeMembers =
    ["post-category", "all", "categories"].includes(value.type) && Boolean(value.excludeMembers);

  if (value.type === "post-category" && postCategory !== undefined) {
    return { type: "categories", categories: postCategory ? [postCategory] : [], excludeMembers };
  }

  return {
    type: value.type,
    categories: value.categories || [],
    subscribers: (value.subscribers || []).map((s) => s._id ?? s),
    excludeMembers,
  };
}

// Rótulo completo do público, incluindo o "exceto membros"
export function audienceLabel(audience = {}) {
  const label = AUDIENCE_LABELS[audience.type] ?? "";
  const excludes = audience.excludeMembers && ["all", "categories"].includes(audience.type);
  return excludes ? `${label} (exceto membros)` : label;
}

export const RECIPIENT_STATUS_LABELS = { sent: "Enviado", failed: "Falhou", pending: "Pendente" };

/**
 * Status do envio como deve aparecer na tela: "sent" só quando todos receberam.
 * failed = ninguém recebeu | partial = parte falhou
 */
export const CAMPAIGN_STATUS = {
  draft: { label: "Rascunho", style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  sending: { label: "Enviando", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  sent: { label: "Enviado", style: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  partial: { label: "Parcial", style: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  failed: { label: "Falhou", style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function campaignStatusKey(campaign) {
  if (campaign.status !== "sent") return campaign.status;
  const { sent = 0, failed = 0 } = campaign.stats || {};
  if (failed > 0 && sent === 0) return "failed";
  if (failed > 0) return "partial";
  return "sent";
}
