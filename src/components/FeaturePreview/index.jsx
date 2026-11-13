// Miniaturas do que o leitor vê com cada recurso ligado ou desligado (página
// Recursos do painel). Desenho em HTML/CSS: sem imagem para baixar e sempre
// fiel às cores do blog. Decorativas: o texto do cartão diz o mesmo.

const Lines = ({ n = 4, className = "bg-gray-300 dark:bg-gray-600" }) => (
  <div className="space-y-1.5">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className={`h-1.5 rounded-full ${className}`} style={{ width: `${[100, 92, 96, 70, 88][i % 5]}%` }} />
    ))}
  </div>
);

// Página do post em miniatura (topo, título e texto)
function MiniPage({ children, top, bottom }) {
  return (
    <div className="relative h-full rounded-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {top}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100">marck0101</span>
        <span className="flex gap-1">
          <span className="w-4 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="w-4 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
        </span>
      </div>
      <div className="px-3 pt-2 space-y-2">
        <div className="h-2.5 w-3/4 rounded bg-gray-800 dark:bg-gray-200" />
        {children}
      </div>
      {bottom}
    </div>
  );
}

function Skins({ on }) {
  const styles = [
    {
      label: "Atual",
      page: "bg-[#ffffff] border-gray-200",
      mast: <span className="text-[10px] font-bold text-gray-900">marck0101</span>,
      line: "bg-gray-300",
      always: true,
    },
    {
      label: "Jornal",
      page: "bg-[#f4ecd8] border-[#1d1a16]/40",
      mast: <span className="text-[11px] font-serif font-black italic text-[#1d1a16] border-b-[3px] border-double border-[#1d1a16] w-full text-center">marck0101</span>,
      line: "bg-[#1d1a16]/40",
    },
    {
      label: "Terminal",
      page: "bg-[#0a0f0a] border-[#4cc768]",
      mast: <span className="text-[10px] font-mono text-[#6dff8a]">C:\&gt;MARCK</span>,
      line: "bg-[#4cc768]/60",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {styles.map((s) => {
        const off = !on && !s.always;
        return (
          <div key={s.label} className="flex flex-col gap-1">
            <div className={`relative flex-1 rounded-md border p-2 flex flex-col items-center gap-2 ${s.page} ${off ? "opacity-25 grayscale" : ""}`}>
              {s.mast}
              <div className="w-full"><Lines n={3} className={s.line} /></div>
            </div>
            <span className={`text-[10px] text-center ${off ? "line-through text-gray-400" : "text-gray-600 dark:text-gray-300"}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TerminalOffer({ on }) {
  return (
    <MiniPage
      bottom={
        on ? (
          <div className="absolute inset-x-0 bottom-0 bg-[#0a0f0a] border-t border-[#4cc768] px-2 py-1.5 flex items-center gap-1.5">
            <span className="flex-1 text-[9px] font-mono text-[#6dff8a] truncate">&gt; Ler no modo terminal?</span>
            <span className="text-[8px] font-mono px-1 bg-[#6dff8a] text-[#0a0f0a]">[S]</span>
            <span className="text-[8px] font-mono px-1 border border-[#6dff8a] text-[#6dff8a]">[N]</span>
          </div>
        ) : null
      }
    >
      <Lines n={4} />
    </MiniPage>
  );
}

function Toc({ on }) {
  return (
    <MiniPage>
      {on && (
        <div className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 space-y-0.5">
          <span className="block text-[8px] leading-tight font-semibold text-gray-800 dark:text-gray-100">☰ Neste post</span>
          {["1.", "2.", "3."].map((n, i) => (
            <div key={n} className="flex items-center gap-1 leading-none">
              <span className="text-[7px] text-gray-400">{n}</span>
              <span className="h-1 rounded-full bg-blue-400/70" style={{ width: `${[60, 75, 45][i]}%` }} />
            </div>
          ))}
        </div>
      )}
      <Lines n={on ? 1 : 4} />
    </MiniPage>
  );
}

function ReadingBar({ on }) {
  return (
    <MiniPage top={on ? <div className="absolute top-0 left-0 h-1 w-3/5 bg-blue-600 dark:bg-blue-400 z-10" /> : null}>
      <Lines n={4} />
    </MiniPage>
  );
}

// Cartões com o selo "Lido" e a barra de quanto já leu
function History({ on }) {
  const cards = [
    { label: "✓ Lido", pct: 100, tone: "bg-green-600" },
    { label: "42% lido", pct: 42, tone: "bg-blue-600 dark:bg-blue-400" },
    { label: null, pct: 0 },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {cards.map((c, i) => (
        <div key={i} className="flex flex-col rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="relative h-1/2 bg-gray-200 dark:bg-gray-800">
            {on && c.pct > 0 && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10">
                <div className={`h-full ${c.tone}`} style={{ width: `${c.pct}%` }} />
              </div>
            )}
          </div>
          <div className="p-1.5 space-y-1">
            {on && c.label ? (
              <span className={`inline-block rounded-full px-1.5 text-[8px] font-semibold ${c.pct === 100 ? "bg-green-100 text-green-800" : "bg-blue-50 text-blue-700"}`}>{c.label}</span>
            ) : (
              <span className="block h-2.5" />
            )}
            <Lines n={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

const PREVIEWS = { skins: Skins, terminalOffer: TerminalOffer, toc: Toc, readingProgress: ReadingBar, readingHistory: History };

export default function FeaturePreview({ name, on, className = "h-32" }) {
  const Preview = PREVIEWS[name];
  if (!Preview) return null;
  return (
    <div aria-hidden="true" className={`select-none ${className}`}>
      <Preview on={on} />
    </div>
  );
}
