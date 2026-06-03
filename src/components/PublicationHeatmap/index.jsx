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
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            ← {year - 1}
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            {year + 1} →
          </button>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalPosts} {totalPosts === 1 ? "publicação" : "publicações"} em {year}
        </span>
      </div>

      <div className="flex gap-1">
        {/* Labels de dias */}
        <div className="flex flex-col gap-0.5 mr-1 mt-5">
          {DAYS_PT.map((d, i) => (
            <div
              key={i}
              className="h-3 w-3 text-[9px] text-gray-400 dark:text-gray-600 leading-3 flex items-center justify-center"
            >
              {i % 2 === 0 ? d : ""}
            </div>
          ))}
        </div>

        {/* Grid de semanas */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {/* Label de mês */}
              <div className="h-4 text-[9px] text-gray-400 dark:text-gray-600 leading-4 whitespace-nowrap">
                {monthLabels[wi] || ""}
              </div>

              {/* Células do dia */}
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={di}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: "transparent" }}
                    />
                  );
                }

                const key = toKey(day);
                const count = data[key] || 0;
                const label = count
                  ? `${count} post${count > 1 ? "s" : ""} em ${day.toLocaleDateString("pt-BR")}`
                  : `Sem publicações em ${day.toLocaleDateString("pt-BR")}`;

                return (
                  <div
                    key={di}
                    title={label}
                    className="w-3 h-3 rounded-sm cursor-default"
                    style={{ backgroundColor: getColor(count) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-gray-400 dark:text-gray-600">Menos</span>
        {[0, 1, 2, 3].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(v) }}
          />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-600">Mais</span>
      </div>
    </div>
  );
}
