import { useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import CockpitNav from "../../components/CockpitNav";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Loading, Skeleton } from "../../components/Skeleton";
import CockpitService from "../../services/cockpit.service";
import { errorText } from "../../utils/apiError";
import { ALVOS, AREAS, DECISIONS, HYPOTHESIS_RE, MOVE_LABEL, SLUG_RE, STATUSES, TRANSITIONS, VARIANTES_MAX, VARIANTES_MIN, daysLeft, daysLeftText, iceScore, sortByIce } from "../../utils/experiments";
import { useToast } from "../../hooks/useToast";

const labelCls = "text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1";
const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// "2026-12-05" <-> ISO (fim do dia local, para não "vencer" de manhã)
const toDateInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fromDateInput = (v) => (v ? new Date(`${v}T23:59:59`).toISOString() : null);

const EMPTY = {
  title: "",
  hypothesis: "Se … então … porque …",
  area: "conteudo",
  channel: "",
  metric: "",
  guardrailMetric: "",
  impact: 3,
  confidence: 3,
  ease: 3,
  minSample: "",
  plannedEnd: "",
  variants: [{ name: "A (controle)", description: "" }, { name: "B", description: "" }],
  alvo: "",
  chave: "",
  variantes: [],
};

const VARIANTE_VAZIA = { chave: "", texto: "" };

function Slider({ id, label, hint, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label} <span className="font-normal text-gray-500 dark:text-gray-400">({hint})</span>: <output htmlFor={id} className="font-semibold tabular-nums">{value}</output>
      </label>
      <input id={id} type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function ExperimentForm({ experiment, onSaved, onCancel }) {
  const isEdit = Boolean(experiment);
  const [form, setForm] = useState(
    isEdit
      ? {
          title: experiment.title,
          hypothesis: experiment.hypothesis,
          area: experiment.area,
          channel: experiment.channel || "",
          metric: experiment.metric || "",
          guardrailMetric: experiment.guardrailMetric || "",
          impact: experiment.ice.impact,
          confidence: experiment.ice.confidence,
          ease: experiment.ice.ease,
          minSample: experiment.minSample ?? "",
          plannedEnd: toDateInput(experiment.plannedEnd),
          variants: (experiment.variants || []).map((v) => ({ name: v.name, description: v.description || "" })),
          alvo: experiment.alvo || "",
          chave: experiment.chave || "",
          variantes: (experiment.variantes || []).map((v) => ({ chave: v.chave, texto: v.texto })),
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const score = iceScore({ impact: form.impact, confidence: form.confidence, ease: form.ease });

  const setVariant = (i, patch) => set({ variants: form.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) });

  const setVariante = (i, patch) => set({ variantes: form.variantes.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const escolherAlvo = (alvo) => set({ alvo, variantes: alvo && form.variantes.length === 0 ? [{ ...VARIANTE_VAZIA }, { ...VARIANTE_VAZIA }] : form.variantes });

  const submit = async (e) => {
    e.preventDefault();
    if (form.alvo) {
      const lista = form.variantes;
      const chaves = lista.map((v) => v.chave.trim());
      if (!SLUG_RE.test(form.chave.trim())) return setError("Chave do experimento: use só letras minúsculas, números e hífen");
      if (lista.length < VARIANTES_MIN || lista.some((v) => !v.texto.trim() || !SLUG_RE.test(v.chave.trim()))) {
        return setError("Sorteio no site: cada variante precisa de chave (minúsculas, números e hífen) e texto");
      }
      if (new Set(chaves).size !== chaves.length) return setError("Sorteio no site: as chaves das variantes não podem se repetir");
    }
    if (!HYPOTHESIS_RE.test(form.hypothesis)) {
      setError('Escreva a hipótese no formato "Se … então … porque …"');
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        title: form.title,
        hypothesis: form.hypothesis,
        area: form.area,
        channel: form.channel,
        metric: form.metric,
        guardrailMetric: form.guardrailMetric,
        ice: { impact: form.impact, confidence: form.confidence, ease: form.ease },
        minSample: num(form.minSample),
        plannedEnd: fromDateInput(form.plannedEnd),
        variants: form.variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name, description: v.description })),
        // sem alvo, o sorteio no site fica desligado (chave, alvo e variantes saem juntos)
        alvo: form.alvo || null,
        chave: form.alvo ? form.chave.trim() : null,
        variantes: form.alvo ? form.variantes.map((v) => ({ chave: v.chave.trim(), texto: v.texto.trim() })) : [],
      };
      const saved = isEdit ? await CockpitService.updateExperiment(experiment._id, body) : await CockpitService.createExperiment(body);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(errorText(err) || "Erro ao salvar o experimento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={isEdit ? "Editar experimento" : "Novo experimento"} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
      <h2 className="font-semibold">{isEdit ? "Editar experimento" : "Novo experimento"}</h2>

      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor="expTitle" className={labelCls}>Título</label>
          <input id="expTitle" className="input" required minLength={3} maxLength={120} value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div>
          <label htmlFor="expArea" className={labelCls}>Área</label>
          <select id="expArea" className="input" value={form.area} onChange={(e) => set({ area: e.target.value })}>
            {Object.entries(AREAS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="expHyp" className={labelCls}>Hipótese <span className="font-normal text-gray-500 dark:text-gray-400">(Se … então … porque …)</span></label>
        <textarea id="expHyp" className="input" rows={3} required maxLength={600} value={form.hypothesis} onChange={(e) => set({ hypothesis: e.target.value })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="expChannel" className={labelCls}>Canal</label>
          <input id="expChannel" className="input" maxLength={80} placeholder="Ex.: LinkedIn" value={form.channel} onChange={(e) => set({ channel: e.target.value })} />
        </div>
        <div>
          <label htmlFor="expMetric" className={labelCls}>Métrica principal</label>
          <input id="expMetric" className="input" maxLength={120} placeholder="Ex.: taxa de clique" value={form.metric} onChange={(e) => set({ metric: e.target.value })} />
        </div>
        <div>
          <label htmlFor="expGuard" className={labelCls}>Métrica de proteção <span className="font-normal text-gray-500 dark:text-gray-400">(opcional)</span></label>
          <input id="expGuard" className="input" maxLength={120} placeholder="Ex.: descadastros" value={form.guardrailMetric} onChange={(e) => set({ guardrailMetric: e.target.value })} />
        </div>
      </div>

      <fieldset className="rounded-lg border p-3 space-y-3">
        <legend className="px-1 text-sm font-semibold">Prioridade ICE</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Slider id="expImpact" label="Impacto" hint="1 baixo, 5 alto" value={form.impact} onChange={(impact) => set({ impact })} />
          <Slider id="expConf" label="Confiança" hint="1 chute, 5 certeza" value={form.confidence} onChange={(confidence) => set({ confidence })} />
          <Slider id="expEase" label="Facilidade" hint="1 difícil, 5 fácil" value={form.ease} onChange={(ease) => set({ ease })} />
        </div>
        <p className="text-sm" aria-live="polite">Nota ICE: <strong className="tabular-nums">{score}</strong> <span className="text-gray-500 dark:text-gray-400">(de 125; impacto × confiança × facilidade)</span></p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="expSample" className={labelCls}>Amostra mínima <span className="font-normal text-gray-500 dark:text-gray-400">(opcional)</span></label>
          <input id="expSample" type="number" min={0} className="input" value={form.minSample} onChange={(e) => set({ minSample: e.target.value })} />
        </div>
        <div>
          <label htmlFor="expEnd" className={labelCls}>Fim previsto <span className="font-normal text-gray-500 dark:text-gray-400">(obrigatório para rodar)</span></label>
          <input id="expEnd" type="date" className="input" value={form.plannedEnd} onChange={(e) => set({ plannedEnd: e.target.value })} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Variantes <span className="font-normal text-gray-500 dark:text-gray-400">(pelo menos 2 para rodar)</span></legend>
        {form.variants.map((v, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
            <input aria-label={`Nome da variante ${i + 1}`} className="input" maxLength={60} value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} />
            <input aria-label={`Descrição da variante ${i + 1}`} className="input" maxLength={400} placeholder="O que muda nesta variante" value={v.description} onChange={(e) => setVariant(i, { description: e.target.value })} />
            <button type="button" onClick={() => set({ variants: form.variants.filter((_, j) => j !== i) })} aria-label={`Remover variante ${i + 1}`} className="px-3 py-2 rounded-lg border text-sm">Remover</button>
          </div>
        ))}
        {form.variants.length < 6 && (
          <button type="button" onClick={() => set({ variants: [...form.variants, { name: "", description: "" }] })} className="text-sm text-blue-700 dark:text-blue-300 hover:underline">+ Adicionar variante</button>
        )}
      </fieldset>

      <fieldset className="rounded-lg border p-3 space-y-3">
        <legend className="px-1 text-sm font-semibold">Sorteio no site <span className="font-normal text-gray-500 dark:text-gray-400">(opcional)</span></legend>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Quando o experimento estiver rodando, o site sorteia uma destas variantes, só para quem aceitou os cookies. Sem espaço escolhido, nada muda no site.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="expAlvo" className={labelCls}>Espaço do site</label>
            <select id="expAlvo" className="input" value={form.alvo} onChange={(e) => escolherAlvo(e.target.value)}>
              <option value="">Nenhum (só registro)</option>
              {Object.entries(ALVOS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          {form.alvo && (
            <div>
              <label htmlFor="expChave" className={labelCls}>Chave do experimento <span className="font-normal text-gray-500 dark:text-gray-400">(vai para o GA4)</span></label>
              <input id="expChave" className="input" maxLength={60} placeholder="ex.: cta-diagnostico-texto" value={form.chave} onChange={(e) => set({ chave: e.target.value })} />
            </div>
          )}
        </div>
        {form.alvo && (
          <div className="space-y-2">
            {form.variantes.map((v, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
                <input aria-label={`Chave do texto ${i + 1}`} className="input" maxLength={40} placeholder="chave (ex.: controle)" value={v.chave} onChange={(e) => setVariante(i, { chave: e.target.value })} />
                <input aria-label={`Texto do botão ${i + 1}`} className="input" maxLength={200} placeholder="Texto exibido no site" value={v.texto} onChange={(e) => setVariante(i, { texto: e.target.value })} />
                <button type="button" disabled={form.variantes.length <= VARIANTES_MIN} onClick={() => set({ variantes: form.variantes.filter((_, j) => j !== i) })} aria-label={`Remover texto ${i + 1}`} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50">Remover</button>
              </div>
            ))}
            {form.variantes.length < VARIANTES_MAX && (
              <button type="button" onClick={() => set({ variantes: [...form.variantes, { ...VARIANTE_VAZIA }] })} className="text-sm text-blue-700 dark:text-blue-300 hover:underline">+ Adicionar texto</button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">De {VARIANTES_MIN} a {VARIANTES_MAX} textos. Mantenha um igual ao atual do site para servir de controle.</p>
          </div>
        )}
      </fieldset>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar experimento"}
        </button>
      </div>
    </form>
  );
}

// Resultado: ao concluir vai junto da transição; em experimento já concluído só grava o resultado
function ResultForm({ experiment, onDone, onCancel }) {
  const r = experiment.result || {};
  const concluding = experiment.status === "analisando";
  const [form, setForm] = useState({
    summary: r.summary || "",
    valueA: r.valueA ?? "",
    valueB: r.valueB ?? "",
    sample: r.sample ?? "",
    decision: r.decision || "",
    learning: r.learning || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.summary.trim() || !form.decision || !form.learning.trim()) {
      setError("Para concluir, preencha o resumo, a decisão e o aprendizado");
      return;
    }
    setSaving(true);
    setError("");
    const result = { summary: form.summary, valueA: num(form.valueA), valueB: num(form.valueB), sample: num(form.sample), decision: form.decision, learning: form.learning };
    try {
      if (concluding) await CockpitService.transitionExperiment(experiment._id, "concluido", result);
      else await CockpitService.updateExperiment(experiment._id, { result });
      onDone(concluding);
    } catch (err) {
      setError(errorText(err) || "Erro ao salvar o resultado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={`Resultado de ${experiment.title}`} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-3">
      <h2 className="font-semibold">{concluding ? "Concluir" : "Resultado"}: {experiment.title}</h2>
      <div>
        <label htmlFor="resSummary" className={labelCls}>Resumo do resultado</label>
        <textarea id="resSummary" className="input" rows={2} maxLength={1000} value={form.summary} onChange={(e) => set({ summary: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="resA" className={labelCls}>Valor A <span className="font-normal text-gray-500 dark:text-gray-400">(controle)</span></label>
          <input id="resA" type="number" step="any" className="input" value={form.valueA} onChange={(e) => set({ valueA: e.target.value })} />
        </div>
        <div>
          <label htmlFor="resB" className={labelCls}>Valor B</label>
          <input id="resB" type="number" step="any" className="input" value={form.valueB} onChange={(e) => set({ valueB: e.target.value })} />
        </div>
        <div>
          <label htmlFor="resSample" className={labelCls}>Amostra</label>
          <input id="resSample" type="number" min={0} className="input" value={form.sample} onChange={(e) => set({ sample: e.target.value })} />
        </div>
      </div>
      <div>
        <label htmlFor="resDecision" className={labelCls}>Decisão</label>
        <select id="resDecision" className="input" value={form.decision} onChange={(e) => set({ decision: e.target.value })}>
          <option value="">Escolha…</option>
          {Object.entries(DECISIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="resLearning" className={labelCls}>Aprendizado <span className="font-normal text-gray-500 dark:text-gray-400">(o que levamos disso)</span></label>
        <textarea id="resLearning" className="input" rows={2} maxLength={1000} value={form.learning} onChange={(e) => set({ learning: e.target.value })} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Salvando..." : concluding ? "Concluir experimento" : "Salvar resultado"}
        </button>
      </div>
    </form>
  );
}

function Card({ e, busy, onMove, onEdit, onResult, onDelete }) {
  const left = e.status === "rodando" ? daysLeft(e.plannedEnd) : null;
  return (
    <article aria-label={e.title} className="rounded-lg border bg-white dark:bg-gray-900 p-3 space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{e.title}</h3>
        <span className="shrink-0 rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs font-semibold tabular-nums" title="Nota ICE">ICE {e.iceScore}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{AREAS[e.area]}{e.channel ? ` · ${e.channel}` : ""}{e.metric ? ` · ${e.metric}` : ""}</p>
      <p className="text-gray-600 dark:text-gray-300">{e.hypothesis}</p>

      {e.status === "rodando" && (
        <p className={`font-medium ${left !== null && left < 0 ? "text-red-700 dark:text-red-300" : ""}`}>
          {left !== null && left < 0 ? "✕ " : "▶ "}{daysLeftText(e.plannedEnd)}
          {e.minSample ? ` · amostra mínima ${e.minSample.toLocaleString("pt-BR")}` : ""}
        </p>
      )}

      {(e.status === "concluido" || e.status === "analisando") && e.result?.summary && (
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-2 space-y-1">
          {e.result.decision && <p className="font-semibold">Decisão: {DECISIONS[e.result.decision]}</p>}
          <p>{e.result.summary}</p>
          {e.result.learning && <p><strong>Aprendizado:</strong> {e.result.learning}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {TRANSITIONS[e.status].map((to) => (
          <button
            key={to}
            type="button"
            disabled={busy}
            onClick={() => onMove(e, to)}
            aria-label={`${MOVE_LABEL[to]}: ${e.title}`}
            className="px-2.5 py-1 rounded-lg border text-xs font-medium disabled:opacity-50"
          >
            {MOVE_LABEL[to]}
          </button>
        ))}
        {(e.status === "analisando" || e.status === "concluido") && (
          <button type="button" onClick={() => onResult(e)} aria-label={`Editar resultado: ${e.title}`} className="px-2.5 py-1 rounded-lg border text-xs">Resultado</button>
        )}
        <button type="button" onClick={() => onEdit(e)} aria-label={`Editar: ${e.title}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs">
          <Pencil size={12} aria-hidden="true" /> Editar
        </button>
        <button type="button" onClick={() => onDelete(e)} aria-label={`Excluir: ${e.title}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs text-red-700 dark:text-red-300">
          <Trash2 size={12} aria-hidden="true" /> Excluir
        </button>
      </div>
    </article>
  );
}

export default function CockpitExperiments() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [area, setArea] = useState("");
  const [panel, setPanel] = useState(null); // { kind: "new" | "edit" | "result", experiment? }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  const load = useCallback(() => {
    CockpitService.listExperiments()
      .then(setItems)
      .catch((err) => setError(errorText(err) || "Não foi possível carregar os experimentos"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = useMemo(() => {
    const shown = (items || []).filter((e) => !area || e.area === area);
    return Object.fromEntries(STATUSES.map((s) => [s.key, sortByIce(shown.filter((e) => e.status === s.key))]));
  }, [items, area]);

  const move = async (e, to) => {
    if (to === "concluido") {
      setPanel({ kind: "result", experiment: e });
      return;
    }
    setBusy(true);
    try {
      await CockpitService.transitionExperiment(e._id, to);
      showToast(`"${e.title}" agora está em ${STATUSES.find((s) => s.key === to).label.toLowerCase()}`);
      load();
    } catch (err) {
      showToast(errorText(err) || "Não foi possível mudar o status", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const e = toDelete;
    setToDelete(null);
    try {
      await CockpitService.removeExperiment(e._id);
      showToast("Experimento excluído");
      load();
    } catch (err) {
      showToast(errorText(err) || "Erro ao excluir", "error");
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <ConfirmDialog
        open={Boolean(toDelete)}
        type="danger"
        title="Excluir experimento?"
        description={toDelete ? `"${toDelete.title}" sai do quadro.` : ""}
        confirmText="Excluir"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
      <main className="admin-content max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <CockpitNav />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical size={22} aria-hidden="true" /> Experimentos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 max-w-2xl">
              Cada ideia vira hipótese, roda com prazo e termina em decisão e aprendizado. Mova os cartões pelos botões.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor="areaFilter" className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Área</label>
              <select id="areaFilter" className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Todas</option>
                {Object.entries(AREAS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            {!panel && (
              <button type="button" onClick={() => setPanel({ kind: "new" })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                <Plus size={16} aria-hidden="true" /> Novo experimento
              </button>
            )}
          </div>
        </div>

        {panel?.kind === "result" ? (
          <ResultForm
            key={panel.experiment._id}
            experiment={panel.experiment}
            onCancel={() => setPanel(null)}
            onDone={(concluded) => { setPanel(null); showToast(concluded ? "Experimento concluído" : "Resultado salvo"); load(); }}
          />
        ) : panel ? (
          <ExperimentForm
            key={panel.experiment?._id || "new"}
            experiment={panel.kind === "edit" ? panel.experiment : null}
            onCancel={() => setPanel(null)}
            onSaved={(_, wasEdit) => { setPanel(null); showToast(wasEdit ? "Experimento salvo" : "Experimento criado"); load(); }}
          />
        ) : null}

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!items && !error && (
          <Loading label="Carregando experimentos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" rounded="rounded-xl" />)}
          </Loading>
        )}

        {items && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {STATUSES.map((s) => (
              <section key={s.key} aria-label={s.label} className="rounded-xl bg-gray-50 dark:bg-gray-950/40 border p-3 space-y-3">
                <h2 className="text-sm font-semibold flex items-center justify-between">
                  <span><span aria-hidden="true">{s.symbol}</span> {s.label}</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{byStatus[s.key].length}</span>
                </h2>
                {s.key === "ideia" && byStatus.ideia.length > 1 && <p className="text-xs text-gray-500 dark:text-gray-400">Ordenadas pela nota ICE, maior primeiro.</p>}
                {byStatus[s.key].length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum experimento aqui.</p>
                ) : (
                  byStatus[s.key].map((e) => (
                    <Card
                      key={e._id}
                      e={e}
                      busy={busy}
                      onMove={move}
                      onEdit={(x) => setPanel({ kind: "edit", experiment: x })}
                      onResult={(x) => setPanel({ kind: "result", experiment: x })}
                      onDelete={setToDelete}
                    />
                  ))
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
