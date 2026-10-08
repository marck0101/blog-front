import { CalendarClock } from "lucide-react";

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Status do post no editor.
 * Rascunho pode ter data no calendário; Agendado exige data e publica sozinho.
 */
export default function PostStatusField({ status, plannedAt, onChange, publishLabel = "Publicar agora" }) {
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
          {status === "planned" && (
            <p className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 mt-2">
              <CalendarClock size={14} />
              Publica automaticamente por volta das 9h desse dia e envia o email configurado abaixo.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
