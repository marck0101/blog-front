import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { getSkinPref, loadSkinCss, setSkinPref } from "../utils/skin";
import { trackEvent } from "../utils/analytics";

// Liga/desliga o modo raiz. O tema (ThemeToggle) escolhe qual: Jornal ou Terminal.
export default function SkinToggle() {
  const [on, setOn] = useState(getSkinPref);

  // Chegou ao blog por navegação interna (sem o theme-init): garante o CSS
  useEffect(() => {
    if (on) loadSkinCss();
  }, [on]);

  const label = on ? "Voltar ao visual atual" : "Ver o blog no modo raiz";

  return (
    <button
      type="button"
      onClick={() => {
        setOn(setSkinPref(!on));
        trackEvent("skin_toggle", { skin: on ? "atual" : "raiz" });
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="p-2 rounded-md text-gray-600 dark:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition"
    >
      <Newspaper size={18} />
    </button>
  );
}
