import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleOff,
  ListOrdered,
  Loader2,
  Newspaper,
  SquareTerminal,
  ToggleRight,
  TrendingUp,
} from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import FeaturePreview from "../../components/FeaturePreview";
import SettingsService from "../../services/settings.service";
import { useToast } from "../../hooks/useToast";
import { errorText } from "../../utils/apiError";

// Mesmos nomes do backend (app/config/features.js) e de src/utils/features.js
const FEATURES = [
  {
    name: "skins",
    icon: Newspaper,
    title: "Estilos de época",
    subtitle: "Jornal e Terminal",
    on: "O leitor escolhe Atual, Jornal ou Terminal no ícone de estilo do topo.",
    off: "Todo mundo vê o visual atual. A escolha de cada leitor volta quando religar.",
  },
  {
    name: "terminalOffer",
    icon: SquareTerminal,
    title: "Convite do Terminal",
    subtitle: "Posts de Tecnologia",
    on: "Faixa no rodapé dos posts de Tecnologia convidando para o modo terminal (uma vez por leitor).",
    off: "A faixa não aparece. O Terminal continua no ícone de estilo.",
    needs: "skins",
  },
  {
    name: "toc",
    icon: ListOrdered,
    title: "Sumário do post",
    subtitle: "\"Neste post\"",
    on: "Lista das seções antes do texto, em posts com 3 seções ou mais.",
    off: "Sem a lista. Os links diretos para as seções continuam valendo.",
  },
  {
    name: "readingProgress",
    icon: TrendingUp,
    title: "Barra de leitura",
    subtitle: "Topo da tela",
    on: "Linha fina no topo que enche conforme o leitor avança no texto.",
    off: "Sem a linha no topo.",
  },
];

function StatusPill({ on }) {
  return on ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
      <CheckCircle2 size={14} aria-hidden="true" /> Ligado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
      <CircleOff size={14} aria-hidden="true" /> Desligado
    </span>
  );
}

function Switch({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        on ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-7" : "translate-x-1"}`}
      />
    </button>
  );
}

function FeatureCard({ feature, on, blockedBy, onToggle }) {
  const Icon = feature.icon;
  return (
    <article className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      <div className={`p-4 bg-gray-50 dark:bg-gray-800/40 border-b dark:border-gray-800 transition ${on ? "" : "opacity-70"}`}>
        <FeaturePreview name={feature.name} on={on} />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className={`shrink-0 rounded-lg p-2 ${on ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{feature.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{feature.subtitle}</p>
          </div>
          <Switch on={on} onClick={onToggle} label={feature.title} />
        </div>
        <div className="flex items-center gap-2">
          <StatusPill on={on} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{on ? feature.on : feature.off}</p>
        {blockedBy && on && (
          <p className="text-sm flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            Fora do ar agora: depende de {blockedBy}, que está desligado.
          </p>
        )}
      </div>
    </article>
  );
}

const FOCUSABLE = "button:not([disabled])";

// "Tem certeza?": mostra o antes → depois antes de salvar
function ConfirmChange({ feature, next, onCancel, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef(null);
  const cancelButton = useRef(null);
  const titleId = useId();
  const Icon = feature.icon;
  const verb = next ? "Ligar" : "Desligar";

  useEffect(() => {
    const previous = document.activeElement;
    // Foco no "Cancelar": Enter sem querer não muda nada
    cancelButton.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await SettingsService.setFeature(feature.name, next);
      onDone(data);
    } catch (err) {
      setError(errorText(err) || "Não foi possível salvar. Tente de novo.");
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !busy) {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...panel.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <form
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        onSubmit={submit}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-xl"
      >
        <div className="p-5 border-b dark:border-gray-800 flex items-start gap-3">
          <span className={`shrink-0 rounded-lg p-2 ${next ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 id={titleId} className="text-lg font-semibold">Tem certeza que quer {verb.toLowerCase()} {feature.title.toLowerCase()}?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{next ? feature.on : feature.off}</p>
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <figure className="space-y-1">
              <FeaturePreview name={feature.name} on={!next} className="h-28" />
              <figcaption className="text-xs text-center text-gray-500 dark:text-gray-400">Agora</figcaption>
            </figure>
            <ArrowRight size={20} className="text-gray-400" aria-hidden="true" />
            <figure className="space-y-1">
              <FeaturePreview name={feature.name} on={next} className="h-28" />
              <figcaption className="text-xs text-center font-medium text-gray-700 dark:text-gray-200">Depois</figcaption>
            </figure>
          </div>
        </div>

        <div className="px-5 pt-4 pb-1 space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-300">Vale para todos os leitores em até 1 minuto. Dá para desfazer aqui mesmo.</p>
          {error && (
            <p role="alert" className="text-sm flex items-start gap-1.5 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <button
            ref={cancelButton}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm text-white font-medium inline-flex items-center gap-2 disabled:opacity-50 ${
              next ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? "Salvando..." : `Sim, ${verb.toLowerCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}

// Liga e desliga recursos do blog. Toda mudança pede confirmação ("Tem
// certeza?"); chega aos leitores em até ~1 minuto (cache curto da API).
export default function Features() {
  const showToast = useToast();
  const [features, setFeatures] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [pending, setPending] = useState(null); // { feature, next }
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    SettingsService.getFeatures()
      .then((d) => {
        setFeatures(d.features);
        setUpdatedAt(d.updatedAt);
      })
      .catch((err) => setLoadError(errorText(err) || "Não foi possível carregar os recursos"));
  }, []);

  const done = (data) => {
    const { feature, next } = pending;
    setFeatures(data.features);
    setUpdatedAt(data.updatedAt);
    setPending(null);
    showToast(`${feature.title}: ${next ? "ligado" : "desligado"}`);
  };

  const titleOf = (name) => FEATURES.find((f) => f.name === name)?.title.toLowerCase();

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ToggleRight size={22} /> Recursos do blog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 max-w-2xl">
            Ligue ou desligue o que o leitor vê. A mudança chega ao blog em até 1 minuto, na próxima página que ele abrir.
          </p>
        </div>

        {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}

        {features && (
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.name}
                feature={f}
                on={features[f.name]}
                blockedBy={f.needs && !features[f.needs] ? titleOf(f.needs) : null}
                onToggle={() => setPending({ feature: f, next: !features[f.name] })}
              />
            ))}
          </div>
        )}

        {updatedAt && (
          <p className="text-xs text-gray-400">
            Última alteração: {new Date(updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </main>

      {pending && (
        <ConfirmChange
          feature={pending.feature}
          next={pending.next}
          onCancel={() => setPending(null)}
          onDone={done}
        />
      )}
    </>
  );
}
