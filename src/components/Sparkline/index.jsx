import { useId, useState } from "react";

const W = 160;
const H = 36;
const PAD = 3; // a linha de 2px não encosta nas bordas

const fmtDay = (key) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

/**
 * Sparkline de uma série diária (um valor por dia, null = sem dado).
 * - max: topo da escala (escala comum entre linhas); sem ele, usa o maior da série
 * - Linha 2px na cor de destaque, área bem clara embaixo, sem eixos
 * - Hover/toque: linha vertical no dia + ponto + valor e data
 * - Trechos null (antes da publicação) não desenham nada
 */
export default function Sparkline({ series, dayKeys, max, label = "", formatValue = (v) => v.toLocaleString("pt-BR") }) {
  const [hover, setHover] = useState(null);
  const gradientId = useId();

  const values = series.filter((v) => v !== null);
  const top = Math.max(max ?? Math.max(...values, 0), 1);
  const n = series.length;
  const x = (i) => (n === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (n - 1));
  const y = (v) => H - PAD - (v / top) * (H - PAD * 2);

  // Um caminho por trecho contínuo (null quebra a linha)
  const segments = [];
  let current = [];
  series.forEach((v, i) => {
    if (v === null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push(i);
  });
  if (current.length) segments.push(current);

  const line = (idx) => idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(series[i]).toFixed(1)}`).join(" ");
  const area = (idx) =>
    `${line(idx)} L${x(idx[idx.length - 1]).toFixed(1)},${H - PAD} L${x(idx[0]).toFixed(1)},${H - PAD} Z`;

  const pick = (clientX, rect) => {
    const ratio = (clientX - rect.left) / rect.width;
    const i = Math.round(ratio * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const total = values.reduce((a, b) => a + b, 0);
  const summary = values.length
    ? `${label}: ${formatValue(total)} em ${values.length} dia(s), de ${fmtDay(dayKeys[0])} a ${fmtDay(dayKeys[n - 1])}`
    : `${label}: sem dados no período`;

  const hovered = hover !== null ? series[hover] : undefined;

  return (
    <div className="relative w-full max-w-[10rem]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full h-9 touch-none"
        role="img"
        aria-label={summary}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Linha de base: mostra onde fica o zero */}
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <g className="text-blue-600 dark:text-blue-500">
          {segments.map((idx) =>
            idx.length > 1 ? (
              <g key={idx[0]}>
                <path d={area(idx)} fill={`url(#${gradientId})`} />
                <path d={line(idx)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </g>
            ) : (
              <circle key={idx[0]} cx={x(idx[0])} cy={y(series[idx[0]])} r="2" fill="currentColor" />
            )
          )}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
        </g>
      </svg>
      {/* Ponto do dia em HTML: no SVG esticado (preserveAspectRatio=none) o círculo viraria elipse */}
      {hover !== null && hovered !== null && (
        <span
          className="pointer-events-none absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-blue-600 dark:bg-blue-500 ring-2 ring-white dark:ring-gray-900"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hovered) / H) * 100}%` }}
        />
      )}
      {hover !== null && (
        <div
          role="status"
          className="pointer-events-none absolute z-20 bottom-full mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 px-2 py-1 text-xs shadow-md"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {hovered === null ? "—" : formatValue(hovered)}
          </span>{" "}
          <span className="text-gray-500 dark:text-gray-300">
            {fmtDay(dayKeys[hover])}
            {hovered === null && " · antes de publicar"}
          </span>
        </div>
      )}
    </div>
  );
}
