import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import PostsService from "../../services/posts.service";
import PostStatusBadge from "../PostStatusBadge";

// Mesmos limites do backend (utils/tags.js e blogpost.model)
const MAX_TAGS = 8;
const MAX_PICKS = 3;

// Igual ao normalizeTags do backend: "Core Web Vitals" → "core-web-vitals"
function toTag(raw) {
  return String(raw)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

function TagsInput({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const [known, setKnown] = useState([]);

  useEffect(() => {
    PostsService.getTags().then(setKnown).catch(() => {});
  }, []);

  const full = value.length >= MAX_TAGS;

  const add = (raw) => {
    const tags = String(raw)
      .split(",")
      .map(toTag)
      .filter(Boolean);
    const next = [...value];
    for (const tag of tags) if (!next.includes(tag) && next.length < MAX_TAGS) next.push(tag);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const term = toTag(draft);
  const suggestions = term
    ? known.filter((k) => k.tag.includes(term) && !value.includes(k.tag)).slice(0, 6)
    : [];

  return (
    <div>
      <label htmlFor="tagInput" className="block text-xs text-gray-600 dark:text-gray-300">
        Tags <span className="text-gray-400">({value.length}/{MAX_TAGS})</span>
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border bg-white dark:bg-gray-950 dark:border-gray-700 px-2 py-1.5">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-800 dark:text-gray-200">
            {tag}
            <button type="button" aria-label={`Remover tag ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))} className="text-gray-500 hover:text-red-600">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id="tagInput"
          name="tagInput"
          className="flex-1 min-w-[10rem] bg-transparent text-sm outline-none py-1 dark:text-gray-100"
          placeholder={full ? "Limite de tags atingido" : "Ex.: core web vitals, ga4 (Enter ou vírgula)"}
          value={draft}
          disabled={full}
          autoComplete="off"
          onChange={(e) => {
            const text = e.target.value;
            if (text.includes(",")) add(text);
            else setDraft(text);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500">Já usadas:</span>
          {suggestions.map((s) => (
            <button
              key={s.tag}
              type="button"
              // onMouseDown: escolhe antes do blur do campo transformar o texto em tag
              onMouseDown={(e) => {
                e.preventDefault();
                add(s.tag);
              }}
              className="rounded-full border border-dashed px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300 hover:border-blue-400"
            >
              {s.tag} <span className="text-gray-400">· {s.count}</span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Assuntos específicos do post. Posts com tags em comum aparecem um no "Continue lendo" do outro.
      </p>
    </div>
  );
}

function RelatedPicker({ value, onChange, postId }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);

  const searching = term.trim().length >= 2;
  const visible = searching ? results : [];
  const full = value.length >= MAX_PICKS;

  useEffect(() => {
    if (!searching) return;
    let active = true;
    const t = setTimeout(() => {
      // Qualquer status: dá para ligar um post que ainda vai sair (só aparece para o leitor depois de publicado)
      PostsService.getAll(1, 8, { search: term.trim() })
        .then((d) => active && setResults((d.posts || []).filter((p) => p._id !== postId)))
        .catch(() => active && setResults([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term, searching, postId]);

  const move = (index, delta) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div>
      <p className="block text-xs text-gray-600 dark:text-gray-300">
        Leituras sugeridas <span className="text-gray-400">({value.length}/{MAX_PICKS})</span>
      </p>
      {value.length > 0 && (
        <ol className="mt-1 space-y-1">
          {value.map((p, i) => (
            <li key={p._id} className="flex items-center gap-2 rounded-lg border bg-white dark:bg-gray-950 dark:border-gray-700 px-3 py-2 text-sm">
              <span className="text-xs text-gray-400 tabular-nums">{i + 1}.</span>
              <span className="flex-1 min-w-0 truncate dark:text-gray-100">{p.title || "Post sem título"}</span>
              {p.status && <PostStatusBadge post={p} showDate={false} />}
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" aria-label="Descer" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
              <button type="button" aria-label={`Remover ${p.title}`} onClick={() => onChange(value.filter((x) => x._id !== p._id))} className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="relative mt-1">
        <label htmlFor="relatedSearch" className="sr-only">Buscar post para sugerir</label>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          id="relatedSearch"
          name="relatedSearch"
          className="input !pl-9"
          placeholder={full ? "Limite de leituras sugeridas atingido" : "Buscar post para sugerir no fim deste..."}
          value={term}
          disabled={full}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
        />
        {visible.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-lg border bg-white dark:bg-gray-900 shadow-lg py-1 max-h-72 overflow-y-auto">
            {visible.map((post) => {
              const already = value.some((p) => p._id === post._id);
              return (
                <li key={post._id}>
                  <button
                    type="button"
                    disabled={already}
                    onClick={() => {
                      onChange([...value, { _id: post._id, title: post.title, slug: post.slug, status: post.status }]);
                      setTerm("");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 dark:text-gray-100"
                  >
                    <span className="flex-1 min-w-0 truncate">{post.title}</span>
                    {already ? <span className="text-xs text-gray-500">já escolhido</span> : <PostStatusBadge post={post} showDate={false} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Opcional. Vêm primeiro no "Continue lendo", nesta ordem; o resto é escolhido pelas tags, season e categoria.
        Rascunhos só aparecem para o leitor depois de publicados.
      </p>
    </div>
  );
}

/** Tags + leituras sugeridas: a teia de links internos do post */
export default function PostLinksSection({ tags, relatedPosts, onChange, postId }) {
  return (
    <section className="rounded-lg border p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
      <h2 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-300">Próximas leituras</h2>
      <TagsInput value={tags} onChange={(next) => onChange({ tags: next })} />
      <RelatedPicker value={relatedPosts} onChange={(next) => onChange({ relatedPosts: next })} postId={postId} />
    </section>
  );
}
