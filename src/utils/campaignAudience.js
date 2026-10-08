export const AUDIENCE_LABELS = {
  members: "Membros",
  all: "Todos os assinantes",
  categories: "Por categorias",
  selected: "Assinantes específicos",
};

// Rótulo completo do público, incluindo o "exceto membros"
export function audienceLabel(audience = {}) {
  const label = AUDIENCE_LABELS[audience.type] ?? "";
  const excludes = audience.excludeMembers && ["all", "categories"].includes(audience.type);
  return excludes ? `${label} (exceto membros)` : label;
}
