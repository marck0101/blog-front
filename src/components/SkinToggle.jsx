import { useEffect, useRef, useState } from "react";
import { Check, Newspaper, Palette, SquareTerminal } from "lucide-react";
import { loadSkinCss, setSkin, useSkin } from "../utils/skin";
import { trackEvent } from "../utils/analytics";

const OPTIONS = [
  { value: "atual", label: "Visual atual", icon: Palette },
  { value: "jornal", label: "Jornal", icon: Newspaper },
  { value: "terminal", label: "Terminal", icon: SquareTerminal },
];

// Escolha do estilo do blog. O ícone mostra o estilo em uso.
export default function SkinToggle() {
  const skin = useSkin();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = OPTIONS.find((o) => o.value === skin) || OPTIONS[0];
  const Icon = current.icon;

  // Chegou ao blog por navegação interna (sem o theme-init): garante o CSS
  useEffect(() => {
    if (skin !== "atual") loadSkinCss();
  }, [skin]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (value) => {
    setOpen(false);
    if (value === skin) return;
    setSkin(value);
    trackEvent("skin_toggle", { skin: value, from: skin });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Estilo do blog: ${current.label}`}
        title="Estilo do blog"
        className="p-2 rounded-md text-gray-600 dark:text-gray-300
                   hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition"
      >
        <Icon size={18} />
      </button>

      {open && (
        <div
          role="group"
          aria-label="Estilo do blog"
          className="skin-menu absolute right-0 top-full mt-1 w-48 rounded-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1 z-50"
        >
          {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              aria-pressed={value === skin}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <OptionIcon size={16} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {value === skin && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
