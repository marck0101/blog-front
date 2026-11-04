/**
 * Status de post, iguais em todas as telas.
 *   draft     = Rascunho (pode ter data no calendário editorial)
 *   planned   = Agendado (pronto; publica sozinho na data, ~9h)
 *   published = Publicado
 *   trash     = Na lixeira (deletedAt, independente do status)
 */
export const POST_STATUS = {
  draft: {
    label: "Rascunho",
    style: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  planned: {
    label: "Agendado",
    style: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  published: {
    label: "Publicado",
    style: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  trash: {
    label: "Na lixeira",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export function postStatusKey(post) {
  if (post.deletedAt) return "trash";
  if (post.published || post.status === "published") return "published";
  return post.status === "planned" ? "planned" : "draft";
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Agendado cuja data já passou e ainda não foi ao ar
export function isOverdue(post) {
  return postStatusKey(post) === "planned" && post.plannedAt && new Date(post.plannedAt) < startOfToday();
}

const shortDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

// Data relevante do status: publicado em / agendado para / no calendário
export function postStatusDate(post) {
  const key = postStatusKey(post);
  if (key === "published" && post.publishedAt) return shortDate(post.publishedAt);
  if (post.plannedAt && key !== "trash") return shortDate(post.plannedAt);
  return "";
}

// Rotina diária que publica os agendados: 12h UTC = 9h em Brasília (vercel.json
// do backend). Mesma regra de firstSchedulableDay em app/controllers/posts/post.rules.js.
const DAILY_JOB_UTC_HOUR = 12;
const brDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/**
 * Primeiro dia que dá para agendar (R-POST-16): hoje, se a rotina das 9h ainda
 * não rodou; senão amanhã. "YYYY-MM-DD".
 */
export function firstSchedulableDay(now = new Date()) {
  const today = brDay.format(now);
  const todaysJob = new Date(`${today}T${String(DAILY_JOB_UTC_HOUR).padStart(2, "0")}:00:00.000Z`);
  if (now < todaysJob) return today;
  const tomorrow = new Date(`${today}T12:00:00.000Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

// "YYYY-MM-DD" do date input → sem fuso (evita voltar um dia)
export const toDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

// "YYYY-MM-DD" no fuso local
export const localDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Dia que o post ocupa no calendário (publicado → data de publicação; senão data planejada)
export function postDayKey(post) {
  if (postStatusKey(post) === "published" && post.publishedAt) return localDateKey(post.publishedAt);
  return post.plannedAt ? localDateKey(post.plannedAt) : null;
}
