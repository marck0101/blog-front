import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import CockpitNav from "../../components/CockpitNav";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Loading, Skeleton } from "../../components/Skeleton";
import CockpitService from "../../services/cockpit.service";
import { errorText } from "../../utils/apiError";
import { LINK_GROUPS, isHttpsUrl } from "../../utils/experiments";
import { useToast } from "../../hooks/useToast";

const EMPTY = { label: "", url: "", group: "outros", note: "", order: 0 };
const labelCls = "text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1";

function LinkForm({ link, onSaved, onCancel }) {
  const isEdit = Boolean(link);
  const [form, setForm] = useState(isEdit ? { label: link.label, url: link.url, group: link.group, note: link.note || "", order: link.order ?? 0 } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!isHttpsUrl(form.url)) {
      setError("Use um endereço que comece com https://");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { ...form, url: form.url.trim(), order: Number(form.order) || 0 };
      const saved = isEdit ? await CockpitService.updateLink(link._id, body) : await CockpitService.createLink(body);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(errorText(err) || "Erro ao salvar o link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={isEdit ? "Editar link" : "Novo link"} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-3">
      <h2 className="font-semibold">{isEdit ? "Editar link" : "Novo link"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="linkLabel" className={labelCls}>Nome</label>
          <input id="linkLabel" className="input" required maxLength={80} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </div>
        <div>
          <label htmlFor="linkGroup" className={labelCls}>Grupo</label>
          <select id="linkGroup" className="input" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
            {LINK_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="linkUrl" className={labelCls}>Endereço <span className="font-normal text-gray-400">(só https://)</span></label>
        <input id="linkUrl" type="url" className="input font-mono text-sm" required maxLength={2000} placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor="linkNote" className={labelCls}>Nota <span className="font-normal text-gray-400">(opcional)</span></label>
          <input id="linkNote" className="input" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div>
          <label htmlFor="linkOrder" className={labelCls}>Ordem</label>
          <input id="linkOrder" type="number" min={0} className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

export default function CockpitLinks() {
  const [links, setLinks] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | link
  const [toDelete, setToDelete] = useState(null);
  const showToast = useToast();

  const load = useCallback(() => {
    CockpitService.listLinks()
      .then(setLinks)
      .catch((err) => setError(errorText(err) || "Não foi possível carregar os links"));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    const link = toDelete;
    setToDelete(null);
    try {
      await CockpitService.removeLink(link._id);
      showToast("Link removido");
      load();
    } catch (err) {
      showToast(errorText(err) || "Erro ao remover", "error");
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <ConfirmDialog
        open={Boolean(toDelete)}
        type="danger"
        title="Remover link?"
        description={toDelete ? `"${toDelete.label}" sai da lista. O endereço em si não é afetado.` : ""}
        confirmText="Remover"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <CockpitNav />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 size={22} aria-hidden="true" /> Links</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Atalhos para anúncios, analytics, sistemas e documentos. Abrem em outra aba.</p>
          </div>
          {editing === null && (
            <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Plus size={16} aria-hidden="true" /> Novo link
            </button>
          )}
        </div>

        {editing && (
          <LinkForm
            key={editing === "new" ? "new" : editing._id}
            link={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={(_, wasEdit) => { setEditing(null); showToast(wasEdit ? "Link salvo" : "Link adicionado"); load(); }}
          />
        )}

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!links && !error && (
          <Loading label="Carregando links" className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-28" rounded="rounded-xl" />)}
          </Loading>
        )}
        {links && links.length === 0 && <p className="text-gray-500">Nenhum link ainda. Adicione o primeiro atalho.</p>}

        {links && LINK_GROUPS.map((g) => {
          const items = links.filter((l) => l.group === g.key);
          if (!items.length) return null;
          return (
            <section key={g.key} aria-label={g.label} className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{g.label}</h2>
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((l) => (
                  <li key={l._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 flex flex-col gap-2">
                    <a href={isHttpsUrl(l.url) ? l.url : undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 dark:text-blue-300 hover:underline inline-flex items-center gap-1.5">
                      {l.label} <ExternalLink size={14} aria-hidden="true" /><span className="sr-only">(abre em outra aba)</span>
                    </a>
                    {l.note && <p className="text-sm text-gray-600 dark:text-gray-300">{l.note}</p>}
                    <div className="flex gap-2 mt-auto">
                      <button type="button" onClick={() => setEditing(l)} aria-label={`Editar ${l.label}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs">
                        <Pencil size={13} aria-hidden="true" /> Editar
                      </button>
                      <button type="button" onClick={() => setToDelete(l)} aria-label={`Remover ${l.label}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs text-red-700 dark:text-red-300">
                        <Trash2 size={13} aria-hidden="true" /> Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </>
  );
}
