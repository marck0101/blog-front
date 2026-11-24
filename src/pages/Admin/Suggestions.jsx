import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Archive, CheckCircle2, Eye, EyeOff, Lightbulb, Mail, Trash2, Undo2, Wand2 } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import ConfirmDialog from "../../components/ConfirmDialog";
import { SkeletonCards } from "../../components/Skeleton";
import SuggestionsService from "../../services/suggestions.service";
import PostsService from "../../services/posts.service";
import SubscriberService from "../../services/subscriber.service";
import { notifyNewSuggestionsChanged } from "../../utils/newSuggestions";
import { errorText } from "../../utils/apiError";
import { useToast } from "../../hooks/useToast";

// Mesmos status do backend (app/models/suggestion.model.js)
const TABS = [
  { value: "new", label: "Novas" },
  { value: "planned", label: "Vão virar post" },
  { value: "done", label: "Atendidas" },
  { value: "archived", label: "Arquivadas" },
];

const KIND_LABEL = { topic: "Tema", participate: "Quer participar", other: "Outra ideia" };
const PUBLIC_MAX = 300;

const formatDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const isLive = (post) => Boolean(post?.published);

// Busca de post para ligar à sugestão (título), mostra o status de cada um
function PostPicker({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (search.trim().length < 2) return undefined;
    const timer = setTimeout(() => {
      PostsService.getAll(1, 8, { search: search.trim() })
        .then((d) => setResults(d?.posts || []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  if (value) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{value.title}</span>
        <span className={`text-xs ${isLive(value) ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
          {isLive(value) ? "publicado" : "ainda não publicado"}
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-xs underline text-gray-500 dark:text-gray-300">
          trocar
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        aria-label="Buscar o post que atendeu a sugestão"
        placeholder="Buscar post pelo título"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
      />
      {search.trim().length >= 2 && (
        <ul className="mt-1 rounded-lg border divide-y dark:divide-gray-800 max-h-56 overflow-y-auto">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Nenhum post com esse título.</li>}
          {results.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => onChange(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {p.title} <span className="text-xs text-gray-500">· {isLive(p) ? "publicado" : p.status === "planned" ? "agendado" : "rascunho"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// "Marcar como atendida" / editar a vitrine de uma atendida
function DonePanel({ suggestion, busy, onSave, onCancel }) {
  const [post, setPost] = useState(suggestion.post || null);
  const [publicText, setPublicText] = useState(suggestion.publicText || suggestion.message.slice(0, PUBLIC_MAX));
  const [isPublic, setIsPublic] = useState(suggestion.isPublic);
  const [notify, setNotify] = useState(!suggestion.notifiedAt);
  const live = isLive(post);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      status: "done",
      post: post?._id || null,
      publicText: publicText.trim(),
      isPublic: live && isPublic && Boolean(publicText.trim()),
      notify: live && notify && !suggestion.notifiedAt,
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Post que atendeu a sugestão</p>
        <PostPicker value={post} onChange={setPost} />
      </div>
      <div>
        <label htmlFor={`pub-${suggestion._id}`} className="text-sm font-medium">
          Texto que aparece no blog
        </label>
        <textarea
          id={`pub-${suggestion._id}`}
          rows={2}
          maxLength={PUBLIC_MAX}
          value={publicText}
          onChange={(e) => setPublicText(e.target.value)}
          className="input mt-1"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Resuma sem dados pessoais. O texto original e o email nunca aparecem. {publicText.length}/{PUBLIC_MAX}
        </p>
      </div>
      <label className={`flex items-center gap-2 text-sm ${live ? "" : "opacity-50"}`}>
        <input type="checkbox" checked={live && isPublic} disabled={!live} onChange={(e) => setIsPublic(e.target.checked)} />
        Mostrar em “Vocês pediram, saiu” (/sugestoes)
        {suggestion.allowName ? " com o primeiro nome" : " sem nome (a pessoa não autorizou)"}
      </label>
      {!suggestion.notifiedAt ? (
        <label className={`flex items-center gap-2 text-sm ${live ? "" : "opacity-50"}`}>
          <input type="checkbox" checked={live && notify} disabled={!live} onChange={(e) => setNotify(e.target.checked)} />
          Avisar {suggestion.name || suggestion.email} por email com o link do post
        </label>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">Pessoa avisada por email em {formatDate(suggestion.notifiedAt)}.</p>
      )}
      {post && !live && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Vitrine e aviso ficam disponíveis quando o post for publicado.</p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy || !post}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Salvar como atendida
        </button>
      </div>
    </form>
  );
}

function SuggestionCard({ suggestion, categoryLabel, busy, onUpdate, onDelete }) {
  const [editingDone, setEditingDone] = useState(false);
  const [notes, setNotes] = useState(suggestion.notes || "");
  const notesChanged = notes.trim() !== (suggestion.notes || "");
  const { status } = suggestion;

  const save = async (payload, message) => {
    const ok = await onUpdate(suggestion, payload, message);
    if (ok) setEditingDone(false);
  };

  return (
    <li className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
          {KIND_LABEL[suggestion.kind] || suggestion.kind}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{categoryLabel}</span>
        {suggestion.isPublic && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-medium">
            <Eye size={12} aria-hidden="true" /> No blog
          </span>
        )}
        <span className="text-gray-500 dark:text-gray-300 ml-auto">{formatDate(suggestion.createdAt)}</span>
      </div>

      <p className="whitespace-pre-line text-gray-900 dark:text-gray-100">{suggestion.message}</p>

      <p className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{suggestion.name || "Sem nome"}</span>
        <a href={`mailto:${suggestion.email}`} className="inline-flex items-center gap-1 underline">
          <Mail size={14} aria-hidden="true" /> {suggestion.email}
        </a>
        {suggestion.subscriber?.status === "active" && (
          <span className="text-xs text-green-700 dark:text-green-400">
            {suggestion.subscribed ? "assinou junto com a sugestão" : "já é assinante"}
          </span>
        )}
        {suggestion.sourcePath && suggestion.sourcePath !== "/sugestoes" && (
          <span className="text-xs text-gray-500 dark:text-gray-400">veio de {suggestion.sourcePath}</span>
        )}
      </p>

      {status === "done" && suggestion.post && !editingDone && (
        <p className="text-sm">
          Virou{" "}
          <Link to={`/admin/posts/${suggestion.post._id}`} className="font-medium underline">
            {suggestion.post.title}
          </Link>
          {suggestion.isPublic && suggestion.publicText && (
            <span className="text-gray-500 dark:text-gray-300"> · no blog como “{suggestion.publicText}”</span>
          )}
        </p>
      )}

      {editingDone && (
        <DonePanel
          suggestion={suggestion}
          busy={busy}
          onCancel={() => setEditingDone(false)}
          onSave={(payload) =>
            save(payload, (result) => {
              if (result?.notified) return "Sugestão atendida · pessoa avisada por email";
              if (payload.notify) return "Sugestão atendida · o email não saiu, tente avisar à mão";
              return "Sugestão atendida";
            })
          }
        />
      )}

      <div className="space-y-1">
        <label htmlFor={`notes-${suggestion._id}`} className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Anotação (só você vê)
        </label>
        <div className="flex gap-2">
          <input
            id={`notes-${suggestion._id}`}
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: juntar com o post de GA4 de dezembro"
            className="input text-sm"
          />
          {notesChanged && (
            <button
              type="button"
              disabled={busy}
              onClick={() => save({ notes: notes.trim() }, "Anotação salva")}
              className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
            >
              Salvar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {status === "new" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ status: "planned" }, "Sugestão em Vão virar post")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Wand2 size={15} aria-hidden="true" /> Vai virar post
          </button>
        )}
        {status !== "done" && !editingDone && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditingDone(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-50"
          >
            <CheckCircle2 size={15} aria-hidden="true" /> Marcar como atendida
          </button>
        )}
        {status === "done" && !editingDone && (
          <>
            {isLive(suggestion.post) && suggestion.publicText && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  save({ isPublic: !suggestion.isPublic }, suggestion.isPublic ? "Saiu do blog" : "Aparece em /sugestoes")
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-50"
              >
                {suggestion.isPublic ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                {suggestion.isPublic ? "Tirar do blog" : "Mostrar no blog"}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setEditingDone(true)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50">
              Editar
            </button>
          </>
        )}
        {status !== "archived" && status !== "done" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ status: "archived" }, "Sugestão arquivada")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
          >
            <Archive size={15} aria-hidden="true" /> Arquivar
          </button>
        )}
        {(status === "archived" || status === "done") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ status: "new" }, "Sugestão de volta em Novas")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
          >
            <Undo2 size={15} aria-hidden="true" /> Voltar para Novas
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(suggestion)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          <Trash2 size={15} aria-hidden="true" /> Excluir
        </button>
      </div>
    </li>
  );
}

/**
 * Caixinha de sugestões dos leitores. Tudo chega privado; o blog só mostra o
 * que foi atendido e você escolheu mostrar.
 */
export default function Suggestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = TABS.some((t) => t.value === searchParams.get("status")) ? searchParams.get("status") : "new";
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(
    () =>
      SuggestionsService.adminList({ status, page })
        .then((d) => {
          setData(d);
          setError(null);
          notifyNewSuggestionsChanged(d.counts.new);
        })
        .catch(() => setError("Erro ao carregar as sugestões.")),
    [status, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (value) => {
    setPage(1);
    setSearchParams(value === "new" ? {} : { status: value });
  };

  const run = async (action, message) => {
    setBusy(true);
    try {
      const result = await action();
      await load();
      showToast(typeof message === "function" ? message(result) : message);
      return true;
    } catch (err) {
      showToast(errorText(err) || "Não foi possível concluir", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onUpdate = (suggestion, payload, message) => run(() => SuggestionsService.update(suggestion._id, payload), message);

  const confirmDelete = async () => {
    const suggestion = toDelete;
    setToDelete(null);
    await run(() => SuggestionsService.remove(suggestion._id), "Sugestão excluída");
  };

  const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.label || slug;

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir sugestão?"
        description="Some daqui e do blog, com o email e o nome de quem mandou. Se a pessoa assinou junto, a inscrição continua (cancele em Assinantes). Isso não pode ser desfeito."
        confirmText="Excluir"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <main className="admin-content max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Lightbulb size={22} /> Sugestões
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            O que os leitores mandam pela caixinha (<a href="/sugestoes" target="_blank" rel="noreferrer" className="underline">/sugestoes</a>).
            Nada aparece no blog até você marcar como atendida, ligar ao post e escolher mostrar.
          </p>
        </div>

        <div role="tablist" className="flex flex-wrap gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => changeTab(tab.value)}
              className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition ${
                status === tab.value
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {tab.label}
              {data && <span className="ml-1.5 text-xs tabular-nums opacity-70">({data.counts[tab.value]})</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!data && !error && <SkeletonCards count={3} lines={3} label="Carregando sugestões" />}

        {data && data.suggestions.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300 py-6 text-center">
            {status === "new" ? "Nenhuma sugestão nova." : "Nada por aqui."}
          </p>
        )}

        {data && data.suggestions.length > 0 && (
          <ul className="space-y-3">
            {data.suggestions.map((s) => (
              <SuggestionCard
                key={`${s._id}-${s.updatedAt}`}
                suggestion={s}
                categoryLabel={categoryLabel(s.category)}
                busy={busy}
                onUpdate={onUpdate}
                onDelete={setToDelete}
              />
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">
              Anterior
            </button>
            <span className="tabular-nums text-gray-500 dark:text-gray-300">
              {page} de {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-300">
          Você recebe um email a cada sugestão nova. A caixinha liga e desliga em{" "}
          <Link to="/admin/recursos" className="underline">Recursos</Link>.
        </p>
      </main>
    </>
  );
}
