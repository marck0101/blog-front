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
