// Textos e regras de exibição do registro de ações do admin (SEC-09)

export const AUDIT_ACTIONS = [
  { value: "post.publish", label: "Post publicado" },
  { value: "post.unpublish", label: "Post tirado do ar" },
  { value: "post.trash", label: "Post enviado para a lixeira" },
  { value: "post.restore", label: "Post restaurado" },
  { value: "post.delete_permanent", label: "Post excluído de vez" },
  { value: "campaign.send", label: "Envio disparado" },
  { value: "campaign.retry", label: "Reenvio de falhas" },
  { value: "subscriber.update", label: "Assinante alterado" },
  { value: "subscriber.delete", label: "Assinante excluído" },
  { value: "season.delete", label: "Season excluída" },
  { value: "linkedin.share", label: "Publicação manual no LinkedIn" },
  { value: "auth.login_success", label: "Login realizado" },
  { value: "auth.login_failure", label: "Falha de login" },
];

const LABELS = Object.fromEntries(AUDIT_ACTIONS.map((a) => [a.value, a.label]));
export const actionLabel = (action) => LABELS[action] || action;

const META_LABELS = {
  audienceSize: "público",
  failed: "falhas",
  tier: "plano",
  status: "status",
  force: "forçado",
  method: "método",
  reason: "motivo",
  skip2fa: "sem 2º fator",
  recovery: "código de recuperação",
  firstSetup: "primeira configuração",
};

const metaValue = (v) => (v === true ? "sim" : v === false ? "não" : String(v));

// [{ key, text }] só do que a API mandou
export function metaItems(meta) {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta).map(([key, v]) => ({ key, text: `${META_LABELS[key] || key}: ${metaValue(v)}` }));
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Ações em que o alvo não está mais no ar: sem link
const GONE = new Set(["post.trash", "post.delete_permanent", "season.delete", "post.unpublish"]);

// Link para o post ou a season quando o rótulo é um slug e o alvo ainda pode existir
export function targetHref(entry) {
  const { type, label } = entry?.target || {};
  if (!label || !SLUG.test(label) || GONE.has(entry.action)) return null;
  if (type === "post") return `/blog/${label}`;
  if (type === "season") return `/seasons/${label}`;
  return null;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatAuditDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d).replace(", ", " ");
}
