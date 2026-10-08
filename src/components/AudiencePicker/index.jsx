import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import FilterChips from "../FilterChips";
import CampaignService from "../../services/campaign.service";
import SubscriberService from "../../services/subscriber.service";
import { AUDIENCE_LABELS, AUDIENCE_HINTS, audienceToApi } from "../../utils/campaignAudience";

function SubscriberPicker({ selected, onChange }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    SubscriberService.getAll({ tier: "member", status: "active", limit: 100 })
      .then((data) => setMembers(data.subscribers))
      .catch(() => setMembers([]));
  }, []);

  const isSelected = (sub) => selected.some((s) => s._id === sub._id);
  const toggle = (sub) =>
    onChange(isSelected(sub) ? selected.filter((s) => s._id !== sub._id) : [...selected, sub]);
  const allMembersSelected = members.length > 0 && members.every(isSelected);
  const toggleAllMembers = () =>
    onChange(
      allMembersSelected
        ? selected.filter((s) => !members.some((m) => m._id === s._id))
        : [...selected, ...members.filter((m) => !isSelected(m))]
    );

  const searching = search.trim().length >= 2;

  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(() => {
      SubscriberService.getAll({ search, status: "active", limit: 8 })
        .then((data) => setResults(data.subscribers))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, searching]);

  const add = (sub) => {
    if (!selected.some((s) => s._id === sub._id)) onChange([...selected, sub]);
    setSearch("");
  };

  return (
    <div className="space-y-3">
      {members.length > 0 && (
        <div className="rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Membros ({members.length})
            </span>
            <button
              type="button"
              onClick={toggleAllMembers}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {allMembersSelected ? "Desmarcar todos" : "Marcar todos"}
            </button>
          </div>
          <ul className="max-h-56 overflow-auto divide-y dark:divide-gray-800">
            {members.map((m) => (
              <li key={m._id}>
                <label className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="checkbox" checked={isSelected(m)} onChange={() => toggle(m)} />
                  <span className="text-gray-900 dark:text-gray-100">{m.name || "—"}</span>
                  <span className="text-gray-500 truncate">{m.email}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-300">
        Para incluir alguém que não é membro, busque abaixo.
      </p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s._id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs"
            >
              {s.tier === "member" && <Crown size={12} />}
              {s.name ? `${s.name} <${s.email}>` : s.email}
              <button type="button" onClick={() => onChange(selected.filter((x) => x._id !== s._id))}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar assinante por nome ou email..."
          className="input w-full"
        />
        {searching && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-lg max-h-64 overflow-auto">
            {results.map((sub) => (
              <li key={sub._id}>
                <button
                  type="button"
                  onClick={() => add(sub)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  {sub.tier === "member" && <Crown size={14} className="text-amber-500" />}
                  <span className="text-gray-900 dark:text-gray-100">{sub.name || "—"}</span>
                  <span className="text-gray-500">{sub.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RecipientsPreview({ preview }) {
  if (!preview) {
    return <p className="text-sm text-gray-500 dark:text-gray-300">Calculando destinatários...</p>;
  }

  const { count, sample } = preview;
  if (count === 0) {
    return (
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
        Nenhum assinante ativo neste público.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {count} destinatário{count !== 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sample.map((s) => (
          <span
            key={s._id}
            title={s.email}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {s.tier === "member" && <Crown size={11} className="text-amber-500" />}
            {s.name || s.email}
          </span>
        ))}
        {count > sample.length && (
          <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-300">
            e mais {count - sample.length}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Escolha do público de um envio + prévia de quem vai receber.
 *
 * value: { type, categories, subscribers (objetos), excludeMembers }
 * postCategory: habilita a opção "categoria do post" (editor de post)
 * onPreview: recebe { count, sample } quando a prévia atualiza
 */
export default function AudiencePicker({ value, onChange, categories = [], postCategory, onPreview }) {
  const [preview, setPreview] = useState(null);

  const typeOptions = [
    ...(postCategory !== undefined
      ? [{ slug: "post-category", label: AUDIENCE_LABELS["post-category"] }]
      : []),
    ...["members", "all", "categories", "selected"].map((slug) => ({ slug, label: AUDIENCE_LABELS[slug] })),
  ];

  const set = (patch) => onChange({ ...value, ...patch });
  const canExclude = ["post-category", "all", "categories"].includes(value.type);
  const postCategoryLabel = categories.find((c) => c.slug === postCategory)?.label ?? postCategory;

  const apiAudience = audienceToApi(value, postCategory);
  const audienceKey = JSON.stringify(apiAudience);

  useEffect(() => {
    const t = setTimeout(() => {
      CampaignService.audiencePreview(JSON.parse(audienceKey))
        .then((data) => {
          setPreview(data);
          onPreview?.(data);
        })
        .catch(() => setPreview(null));
    }, 300);
    return () => clearTimeout(t);
  }, [audienceKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <FilterChips
        options={typeOptions}
        selected={value.type}
        onChange={(type) => set({ type })}
        multiSelect={false}
        showAll={false}
      />
      <p className="text-sm text-gray-500 dark:text-gray-300">
        {value.type === "post-category"
          ? `Assinantes ativos que seguem "${postCategoryLabel}". Acompanha a categoria se você trocar.`
          : AUDIENCE_HINTS[value.type]}
      </p>

      {value.type === "categories" && (
        <FilterChips
          options={categories}
          selected={value.categories}
          onChange={(cats) => set({ categories: cats })}
          multiSelect
          showAll={false}
        />
      )}

      {canExclude && (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={value.excludeMembers}
            onChange={(e) => set({ excludeMembers: e.target.checked })}
          />
          Exceto membros (ex.: assunto que os membros já dominam)
        </label>
      )}

      {value.type === "selected" && (
        <SubscriberPicker selected={value.subscribers} onChange={(subscribers) => set({ subscribers })} />
      )}

      <RecipientsPreview preview={preview} />
    </div>
  );
}
