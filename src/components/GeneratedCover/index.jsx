import { useEffect, useState } from "react";
import { autoCoverUrl } from "../../seo/site";

// Capa de reserva para quem não tem capa própria (Sprint R6, docs/CAPAS.md).
// Com post (slug): <img> da capa automática da API (PNG 1200x630, padrão Relatório).
// Sem slug ou se a imagem falhar: bloco liso no mesmo padrão (papel, traço tijolo,
// rótulo mono, título serifado). Sem degradê.
const PAPEL = "#F4F1EA";
const TIJOLO = "#D9542B";
const TINTA = "#1C1B19";

function useTema() {
  const read = () =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "escuro" : "claro";
  const [tema, setTema] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setTema(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return tema;
}

// size: "lg" (grade, páginas de season) | "sm" (miniatura: só a categoria)
export default function GeneratedCover({ post, title, category, categoryLabel, size = "lg", priority = false }) {
  const tema = useTema();
  const [failed, setFailed] = useState(false);
  const src = autoCoverUrl(post, tema);
  const label = categoryLabel || category;
  const heading = title || post?.title;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={heading ? `Capa do artigo: ${heading}` : "Capa do artigo"}
        width={1200}
        height={630}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  const small = size === "sm";
  return (
    <div
      aria-hidden
      data-testid="capa-lisa"
      style={{ backgroundColor: PAPEL, color: TINTA }}
      className={`skin-cover w-full h-full flex flex-col justify-between ${small ? "p-2" : "p-4"}`}
    >
      <div>
        <span aria-hidden style={{ backgroundColor: TIJOLO }} className={`block ${small ? "h-0.5 w-6 mb-1" : "h-1 w-10 mb-2"}`} />
        {label && (
          <span
            style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}
            className={`uppercase tracking-wide ${small ? "text-[9px]" : "text-[11px]"}`}
          >
            {label}
          </span>
        )}
      </div>
      {!small && heading && (
        <span style={{ fontFamily: 'Fraunces, Georgia, serif' }} className="font-bold leading-snug text-lg line-clamp-3">
          {heading}
        </span>
      )}
    </div>
  );
}
