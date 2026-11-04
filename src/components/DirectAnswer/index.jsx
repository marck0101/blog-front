/**
 * Resposta direta (BLUF) logo abaixo do título: a conclusão do artigo em 1–3
 * frases, para quem só quer a resposta e para buscadores e assistentes de IA,
 * que citam esse trecho. O mesmo texto vai no "abstract" do schema.
 */
export default function DirectAnswer({ text, className = "mt-6" }) {
  const value = (text || "").trim();
  if (!value) return null;

  return (
    <aside
      aria-label="Resposta direta"
      className={`${className} rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/40 px-5 py-4`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Resposta direta</p>
      <p className="mt-1 text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line">{value}</p>
    </aside>
  );
}
