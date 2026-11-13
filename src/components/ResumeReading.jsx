import { useState } from "react";
import { BookOpenCheck, CornerDownRight, X } from "lucide-react";
import { canResume, getHistory, statusOf } from "../utils/readingHistory";
import { hashId } from "../utils/headings";
import { trackEvent } from "../utils/analytics";

// No topo do post: "Você parou em 42% — Continuar de onde parou" ou "Você já
// leu este post". Usa o registro de quando a página abriu (a leitura de agora
// vai atualizando o registro, mas o convite não muda no meio do caminho).
export default function ResumeReading({ slug, contentRef }) {
  const [entry] = useState(() => getHistory()[slug] || null);
  const [open, setOpen] = useState(true);
  // Link para uma seção (#secao) já leva a um ponto do texto: não oferece
  const viaAnchor = Boolean(hashId(window.location.hash));

  if (!entry || !open || viaAnchor) return null;

  if (statusOf(entry) === "lido" && !canResume(entry)) {
    return (
      <p className="skin-resume mt-4 inline-flex items-center gap-1.5 text-sm text-green-800 dark:text-green-300">
        <BookOpenCheck size={16} aria-hidden="true" /> Você já leu este post.
      </p>
    );
  }
  if (!canResume(entry)) return null;

  const resume = () => {
    const el = contentRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const span = Math.max(0, rect.height - window.innerHeight);
      window.scrollTo({ top: top + (span * entry.pos) / 100 });
    }
    trackEvent("resume_reading", { post_slug: slug, percent: entry.pos });
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Continuar a leitura"
      className="skin-resume relative mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 pl-4 pr-11 py-3 text-sm"
    >
      <p className="sm:flex-1 min-w-0 text-gray-800 dark:text-gray-100">
        Você parou em <strong className="tabular-nums">{entry.pos}%</strong> deste post.
      </p>
      <button
        type="button"
        onClick={resume}
        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
      >
        <CornerDownRight size={16} aria-hidden="true" /> Continuar de onde parou
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fechar aviso"
        className="absolute top-2 right-2 p-1.5 rounded-md text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/40"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
