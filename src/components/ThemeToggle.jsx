import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getThemePref, setThemePref, watchSystemTheme } from "../utils/theme";

// Ciclo claro → escuro → sistema. O ícone mostra o modo atual; o rótulo, a ação.
const NEXT = { light: "dark", dark: "system", system: "light" };
const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = {
  light: "Ativar modo claro",
  dark: "Ativar modo escuro",
  system: "Seguir o tema do sistema",
};

export default function ThemeToggle() {
  const [pref, setPref] = useState(getThemePref);

  // Só reaplica a classe; o ícone continua "sistema"
  useEffect(() => watchSystemTheme(() => {}), []);

  const next = NEXT[pref];
  const Icon = ICON[pref];

  return (
    <button
      type="button"
      onClick={() => {
        setThemePref(next);
        setPref(next);
      }}
      aria-label={LABEL[next]}
      title={LABEL[next]}
      className="p-2 rounded-md text-gray-600 dark:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition"
    >
      <Icon size={18} />
    </button>
  );
}
