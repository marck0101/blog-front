import { useEffect, useState } from "react";
import { ToggleRight } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import SettingsService from "../../services/settings.service";
import { useToast } from "../../hooks/useToast";
import { errorText } from "../../utils/apiError";

// Mesmos nomes do backend (app/config/features.js) e de src/utils/features.js
const FEATURES = [
  {
    name: "skins",
    title: "Estilos de época (Jornal e Terminal)",
    help: "Ícone de estilo no topo do blog. Desligado: todo mundo vê o visual atual; a escolha de cada leitor volta quando religar.",
  },
  {
    name: "terminalOffer",
    title: "Convite do Terminal",
    help: "Faixa no rodapé dos posts de Tecnologia convidando para o modo terminal. Só aparece com os estilos de época ligados.",
  },
  {
    name: "toc",
    title: "Sumário do post",
    help: "Bloco \"Neste post\" antes do texto, em posts com 3 seções ou mais. Os links diretos para as seções continuam valendo.",
  },
  {
    name: "readingProgress",
    title: "Barra de leitura",
    help: "Linha fina no topo da tela que acompanha a leitura do post.",
  },
];

function Switch({ on, disabled, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        on ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// Liga e desliga recursos do blog com um clique: vale para os leitores em até
// ~1 minuto (cache curto da API) e já na próxima página que abrirem.
export default function Features() {
  const showToast = useToast();
  const [features, setFeatures] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [saving, setSaving] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    SettingsService.getFeatures()
      .then((d) => {
        setFeatures(d.features);
        setUpdatedAt(d.updatedAt);
      })
      .catch((err) => setLoadError(errorText(err) || "Não foi possível carregar os recursos"));
  }, []);

  const toggle = async ({ name, title }) => {
    const next = !features[name];
    setSaving(name);
    setFeatures((f) => ({ ...f, [name]: next }));
    try {
      const d = await SettingsService.setFeature(name, next);
      setFeatures(d.features);
      setUpdatedAt(d.updatedAt);
      showToast(`${title}: ${next ? "ligado" : "desligado"}`);
    } catch (err) {
      setFeatures((f) => ({ ...f, [name]: !next }));
      showToast(errorText(err) || "Não foi possível salvar", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ToggleRight size={22} /> Recursos do blog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 max-w-2xl">
            Ligue ou desligue com um clique. Chega aos leitores em até 1 minuto, na próxima página que abrirem.
          </p>
        </div>

        {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}

        {features && (
          <section className="rounded-xl border bg-white dark:bg-gray-900 px-5 max-w-2xl">
            {FEATURES.map((f) => {
              const blocked = f.name === "terminalOffer" && !features.skins;
              return (
                <div key={f.name} className="flex items-start justify-between gap-4 py-4 border-b last:border-b-0">
                  <div className="text-sm">
                    <p id={`feature-${f.name}`} className="font-medium text-gray-900 dark:text-gray-100">
                      {f.title}{" "}
                      <span className={features[f.name] ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                        · {features[f.name] ? "ligado" : "desligado"}
                      </span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-300 mt-0.5">{f.help}</p>
                    {blocked && features[f.name] && (
                      <p className="text-amber-700 dark:text-amber-300 mt-1">Fora do ar agora: os estilos de época estão desligados.</p>
                    )}
                  </div>
                  <Switch
                    on={features[f.name]}
                    disabled={saving === f.name}
                    onClick={() => toggle(f)}
                    label={f.title}
                  />
                </div>
              );
            })}
          </section>
        )}

        {updatedAt && (
          <p className="text-xs text-gray-400">
            Última alteração: {new Date(updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </main>
    </>
  );
}
