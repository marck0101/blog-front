import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

/**
 * Perguntas frequentes do post. Aparecem no fim do artigo e viram o schema
 * FAQPage (Google, ChatGPT, Perplexity…). Pares incompletos não são salvos.
 */
export default function FaqFields({ value = [], onChange }) {
  const update = (index, patch) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => onChange(value.filter((_, i) => i !== index));
  const move = (index, delta) => {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <section className="rounded-lg border p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      <div>
        <h2 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-300">FAQ (perguntas frequentes)</h2>
        <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
          Aparece no fim do post e gera o schema de FAQ. Escreva perguntas que o leitor faria
          e respostas diretas, de 1 a 3 frases.
        </p>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">Este post ainda não tem FAQ.</p>
      )}

      {value.map((item, i) => (
        <div key={i} className="rounded-md border bg-white dark:bg-gray-950 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300">Pergunta {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir pergunta"
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Descer pergunta"
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => remove(i)} aria-label="Remover pergunta"
                className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <input
            id={`faq-question-${i}`}
            name={`faq-question-${i}`}
            aria-label={`Pergunta ${i + 1}`}
            className="input text-sm"
            placeholder="Ex.: Quanto investir no Google Ads para começar?"
            maxLength={200}
            value={item.question}
            onChange={(e) => update(i, { question: e.target.value })}
          />
          <textarea
            id={`faq-answer-${i}`}
            name={`faq-answer-${i}`}
            aria-label={`Resposta ${i + 1}`}
            className="input text-sm"
            placeholder="Resposta direta"
            rows={3}
            maxLength={1500}
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { question: "", answer: "" }])}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-white dark:hover:bg-gray-800"
      >
        <Plus size={14} /> Adicionar pergunta
      </button>
    </section>
  );
}
