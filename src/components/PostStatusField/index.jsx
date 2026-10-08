import { useEffect, useRef, useState } from "react";
import { CalendarClock, AlertTriangle } from "lucide-react";
import PostsService from "../../services/posts.service";
import { localDateKey, postDayKey } from "../../utils/postStatus";

const todayInput = () => localDateKey(new Date());

// Dias preferidos para sugerir data livre: terça e sexta (cadência atual)
const PREFERRED_WEEKDAYS = [2, 5];

const formatDay = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

/** Posts do calendário por mês, com cache, para checar conflito de data */
function useMonthPosts() {
  const cache = useRef({});
  return async (year, month) => {
    const key = `${year}-${month}`;
    if (!cache.current[key]) {
      cache.current[key] = PostsService.getCalendar(year, month).catch(() => []);
    }
    return cache.current[key];
  };
}

async function postsOnDay(getMonth, dayKey, ignoreId) {
  const [y, m] = dayKey.split("-").map(Number);
  const posts = await getMonth(y, m);
  return posts.filter((p) => p._id !== ignoreId && postDayKey(p) === dayKey);
}

async function nextFreeDay(getMonth, fromKey, ignoreId) {
  const d = new Date(`${fromKey}T12:00:00`);
  for (let i = 1; i <= 120; i++) {
    d.setDate(d.getDate() + 1);
    if (!PREFERRED_WEEKDAYS.includes(d.getDay())) continue;
    const key = localDateKey(d);
    if ((await postsOnDay(getMonth, key, ignoreId)).length === 0) return key;
  }
  return null;
}

/**
 * Status do post no editor.
 * Rascunho pode ter data no calendário; Agendado exige data e publica sozinho.
 */
// Aviso quando o dia escolhido já tem outro post, com sugestão de data livre
function DateConflict({ dayKey, postId, onPick }) {
  const getMonth = useMonthPosts();
  const [conflicts, setConflicts] = useState([]);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    let alive = true;
    postsOnDay(getMonth, dayKey, postId).then(async (found) => {
      if (!alive) return;
      setConflicts(found);
      setSuggestion(found.length ? await nextFreeDay(getMonth, dayKey, postId) : null);
    });
    return () => {
      alive = false;
    };
  }, [dayKey, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (conflicts.length === 0) return null;

  return (
    <div className="flex items-start gap-2 mt-2 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p>
          {formatDay(dayKey)} já tem post:{" "}
          {conflicts.map((p) => `"${p.title}"`).join(", ")}.
        </p>
        {suggestion && onPick && (
          <button type="button" onClick={() => onPick(suggestion)} className="font-semibold underline hover:no-underline">
            Usar a próxima terça/sexta livre: {formatDay(suggestion)}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PostStatusField({
  status,
  plannedAt,
  onChange,
  publishLabel = "Publicar agora",
  postId,
  alreadyPublished = false,
}) {
  const options = [
    { value: "draft", label: "Rascunho", hint: "Ainda escrevendo. Não vai ao ar sozinho." },
    { value: "planned", label: "Agendado", hint: "Pronto. Vai ao ar sozinho na data escolhida." },
    { value: "published", label: publishLabel, hint: "Vai ao ar ao salvar." },
  ];

  return (
    <section className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>

      <div className="grid sm:grid-cols-3 gap-2">
        {options.map(({ value, label, hint }) => (
          <label
            key={value}
            className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition ${
              status === value
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-400"
            }`}
          >
            <input
              type="radio"
              name="status"
              value={value}
              checked={status === value}
              onChange={() => onChange({ status: value })}
              className="accent-blue-600 mt-0.5"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-300">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      {status !== "published" && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-300 block mb-1">
            {status === "planned" ? (
              <>Publicar em <span className="text-red-500">*</span></>
            ) : (
              "Data no calendário (opcional)"
            )}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={plannedAt}
              min={status === "planned" ? todayInput() : undefined}
              onChange={(e) => onChange({ plannedAt: e.target.value })}
              className="input w-48"
            />
            {status === "draft" && plannedAt && (
              <button
                type="button"
                onClick={() => onChange({ plannedAt: "" })}
                className="text-xs text-gray-500 hover:underline"
              >
                Tirar do calendário
              </button>
            )}
          </div>
          {plannedAt && (
            <DateConflict dayKey={plannedAt} postId={postId} onPick={(day) => onChange({ plannedAt: day })} />
          )}
          {status === "planned" && (
            <p className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 mt-2">
              <CalendarClock size={14} />
              Publica automaticamente por volta das 9h desse dia e envia o email configurado abaixo.
            </p>
          )}
        </div>
      )}

      {status === "published" && !alreadyPublished && <DateConflict dayKey={todayInput()} postId={postId} />}
    </section>
  );
}
