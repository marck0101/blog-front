import { useMemo } from "react";

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DAYS_PT = ["D", "S", "T", "Q", "Q", "S", "S"];

const COLORS = {
  0: "#ebedf0",
  1: "#9be9a8",
  2: "#40c463",
  3: "#216e39",
};

function getColor(count) {
  if (count >= 3) return COLORS[3];
  return COLORS[count] ?? COLORS[0];
}

function buildWeeks(year) {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const days = [];

  // Pad início com nulls até o domingo da semana de Jan 1
  const startPad = jan1.getDay();
  for (let i = 0; i < startPad; i++) days.push(null);

  for (let d = new Date(jan1); d <= dec31; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function toKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;

  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) {
      labels.push(null);
      return;
    }
    const m = firstDay.getMonth();
    if (m !== lastMonth) {
      labels.push(MONTHS_PT[m]);
      lastMonth = m;
    } else {
      labels.push(null);
    }
  });

  return labels;
}

export default function PublicationHeatmap({ data = {}, year, onYearChange }) {
  const weeks = useMemo(() => buildWeeks(year), [year]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  const currentYear = new Date().getFullYear();

  const totalPosts = useMemo(
    () => Object.values(data).reduce((s, v) => s + v, 0),
    [data]
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onYearChange(year - 1)}
            className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            ← {year - 1}
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{year}</span>
          {/* Ano futuro não tem publicações: sem botão para ele */}
          <button
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
            className="text-sm text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            {year + 1} →
          </button>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-300">
          {totalPosts} {totalPosts === 1 ? "publicação" : "publicações"} em {year}
        </span>
      </div>

      {/* Grade fluida: as semanas dividem a largura do card (mínimo 640px, com rolagem) */}
      <div
        className="grid gap-[3px] min-w-[640px]"
        style={{ gridTemplateColumns: `auto repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {/* Linha dos meses */}
        <div />
        {weeks.map((_, wi) => (
          <div key={`m${wi}`} className="h-4 text-[10px] text-gray-400 dark:text-gray-300 leading-4 whitespace-nowrap overflow-visible">
            {monthLabels[wi] || ""}
          </div>
        ))}

        {/* Uma linha por dia da semana */}
        {DAYS_PT.map((d, di) => [
          <div key={`d${di}`} className="pr-1 text-[10px] text-gray-400 dark:text-gray-300 flex items-center">
            {di % 2 === 0 ? d : ""}
          </div>,
          ...weeks.map((week, wi) => {
            const day = week[di];
            if (!day) return <div key={`${wi}-${di}`} />;
            const count = data[toKey(day)] || 0;
            const label = count
              ? `${count} post${count > 1 ? "s" : ""} em ${day.toLocaleDateString("pt-BR")}`
              : `Sem publicações em ${day.toLocaleDateString("pt-BR")}`;
            return (
              <div
                key={`${wi}-${di}`}
                title={label}
                className="aspect-square rounded-sm cursor-default"
                style={{ backgroundColor: getColor(count) }}
              />
            );
          }),
        ])}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-gray-400 dark:text-gray-300">Menos</span>
        {[0, 1, 2, 3].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(v) }}
          />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-300">Mais</span>
      </div>
    </div>
  );
}
