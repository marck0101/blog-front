import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Pencil, Trash2, Plus, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import ConfirmDialog from "../../components/ConfirmDialog";
import SeasonsService from "../../services/seasons.service";
import FaqFields from "../../components/FaqFields";
import { cleanFaq } from "../../seo/site";

const EMPTY = { title: "", slug: "", description: "", order: 0, faq: [] };

// Barra empilhada: publicados / agendados / rascunhos sobre o total da season
function SeasonProgress({ posts }) {
  const total = posts.published + posts.planned + posts.draft;
  if (!total) return <p className="text-xs text-gray-400 mt-2">Nenhum post nesta season ainda.</p>;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div className="mt-3 max-w-md">
      <div
        className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800"
        role="img"
        aria-label={`${posts.published} de ${total} publicados`}
      >
        <div className="bg-green-500" style={{ width: pct(posts.published) }} />
        <div className="bg-blue-500" style={{ width: pct(posts.planned) }} />
        <div className="bg-gray-400 dark:bg-gray-600" style={{ width: pct(posts.draft) }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-300 mt-1.5 flex flex-wrap gap-x-3">
        <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{posts.published} de {total} publicados</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />{posts.planned} agendado(s)</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />{posts.draft} rascunho(s)</span>
      </p>
    </div>
  );
}

// Criar (sem `season`) ou editar uma season
function SeasonForm({ season, onSaved, onCancel }) {
  const isEdit = Boolean(season);
  const [form, setForm] = useState(
    isEdit
      ? {
          title: season.title,
          slug: season.slug,
          description: season.description || "",
          order: season.order ?? 0,
          faq: (season.faq || []).map(({ question, answer }) => ({ question: question || "", answer: answer || "" })),
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const slugChanged = isEdit && form.slug !== season.slug;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, order: Number(form.order) || 0, faq: cleanFaq(form.faq) };
      if (!payload.slug) delete payload.slug; // gerado a partir do título
      const saved = isEdit
        ? await SeasonsService.update(season._id, payload)
        : await SeasonsService.create(payload);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao salvar a season");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-3">
      <h2 className="font-semibold">{isEdit ? "Editar season" : "Nova season"}</h2>

      <div>
        <label htmlFor="seasonTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Título</label>
        <input
          id="seasonTitle"
          name="seasonTitle"
          className="input"
          required
          minLength={3}
          maxLength={100}
          placeholder="Ex.: Mídia paga na prática"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor="seasonSlug" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            Slug <span className="font-normal text-gray-400">(endereço: /seasons/slug)</span>
          </label>
          <input
            id="seasonSlug"
            name="seasonSlug"
            className="input font-mono text-sm"
            placeholder="gerado a partir do título"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="seasonOrder" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Ordem</label>
          <input
            id="seasonOrder"
            name="seasonOrder"
            type="number"
            className="input"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
          />
        </div>
      </div>
      {slugChanged && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Mudar o slug muda o endereço da season e atualiza os posts dela. Links antigos para /seasons/{season.slug} deixam de funcionar.
        </p>
      )}

      <div>
        <label htmlFor="seasonDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
          Descrição <span className="font-normal text-gray-400">(o que o leitor aprende na sequência)</span>
        </label>
        <textarea
          id="seasonDescription"
          name="seasonDescription"
          className="input"
          rows={3}
          maxLength={600}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <FaqFields
        value={form.faq}
        onChange={(faq) => setForm({ ...form, faq })}
        where="na página da season"
        emptyLabel="Esta season ainda não tem FAQ."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar season"}
        </button>
      </div>
    </form>
  );
}

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | season
  const [toDelete, setToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    SeasonsService.getAdmin()
      .then(setSeasons)
      .catch(() => showToast("Erro ao carregar seasons", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    const season = toDelete;
    setToDelete(null);
    try {
      await SeasonsService.remove(season._id);
      showToast("Season excluída");
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao excluir", "error");
    }
  };

  // Setas: troca de lugar e grava a ordem de todas (0, 1, 2…), corrigindo
  // empates antigos do campo "ordem"
  const [reordering, setReordering] = useState(false);
  const move = async (index, delta) => {
    const next = [...seasons];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setSeasons(next);
    setReordering(true);
    try {
      await Promise.all(
        next.map((s, i) => (s.order !== i ? SeasonsService.update(s._id, { order: i }) : null))
      );
      load();
    } catch {
      showToast("Erro ao reordenar", "error");
      load();
    } finally {
      setReordering(false);
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        type="danger"
        title="Excluir season?"
        description={toDelete ? `"${toDelete.title}" será excluída. Só é possível excluir season sem posts.` : ""}
        confirmText="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Layers size={22} /> Seasons</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 max-w-2xl">
              Séries de posts que se complementam. O leitor só vê a season depois que ela tiver pelo menos
              um post publicado. A ordem dos episódios é o campo &quot;Nº do episódio&quot; de cada post; a ordem das
              seasons você muda pelas setas.
            </p>
          </div>
          {editing === null && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={16} /> Nova season
            </button>
          )}
        </div>

        {editing === "new" && (
          <SeasonForm
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); showToast("Season criada"); load(); }}
          />
        )}

        {loading && <p className="text-gray-500">Carregando...</p>}

        {!loading && seasons.length === 0 && (
          <p className="text-gray-500">Nenhuma season ainda. Crie a primeira para agrupar posts que se complementam.</p>
        )}

        <div className="space-y-4">
          {seasons.map((season, index) =>
            editing && editing !== "new" && editing._id === season._id ? (
              <SeasonForm
                key={season._id}
                season={season}
                onCancel={() => setEditing(null)}
                onSaved={() => { setEditing(null); showToast("Season atualizada"); load(); }}
              />
            ) : (
              <article key={season._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{season.title}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">/seasons/{season.slug}</p>
                    {season.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">{season.description}</p>
                    )}
                    <SeasonProgress posts={season.posts} />
                    <p className={`text-xs mt-1 ${season.posts.published > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                      {season.posts.published > 0 ? "Visível para os leitores" : "Oculta: aparece quando o 1º post for publicado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center">
                      <button type="button" disabled={reordering || index === 0} onClick={() => move(index, -1)}
                        aria-label={`Subir "${season.title}"`} title="Subir"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" disabled={reordering || index === seasons.length - 1} onClick={() => move(index, 1)}
                        aria-label={`Descer "${season.title}"`} title="Descer"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                        <ArrowDown size={16} />
                      </button>
                    </span>
                    {season.posts.published > 0 && (
                      <Link to={`/seasons/${season.slug}`} target="_blank" className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:underline">
                        <ExternalLink size={14} /> Ver
                      </Link>
                    )}
                    <button type="button" onClick={() => setEditing(season)} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Pencil size={14} /> Editar
                    </button>
                    <button type="button" onClick={() => setToDelete(season)} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </main>
    </>
  );
}
