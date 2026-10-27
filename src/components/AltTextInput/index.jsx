export const ALT_MAX = 125;

/** Texto alternativo da imagem (lido por leitores de tela, Google e IAs) */
export default function AltTextInput({ id, value, onChange, label = "Texto alternativo (alt)", className = "" }) {
  const text = value || "";
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="input text-sm"
        placeholder="Descreva o que aparece na imagem"
        value={text}
        maxLength={ALT_MAX}
        onChange={(e) => onChange(e.target.value.slice(0, ALT_MAX))}
      />
      <span className={`text-xs ${text ? (text.length >= ALT_MAX ? "text-red-500" : "text-gray-500") : "text-amber-600"}`}>
        {text ? `${text.length}/${ALT_MAX}` : "Sem descrição — preencha para SEO e acessibilidade"}
      </span>
    </div>
  );
}
