import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, FileUp, Pencil, Plus, Trash2, Upload, Users, X } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import ConfirmDialog from "../../components/ConfirmDialog";
import FilterChips from "../../components/FilterChips";
import AudiencesService from "../../services/audiences.service";
import SubscriberService from "../../services/subscriber.service";
import { parseContacts } from "../../utils/parseContacts";

const CHUNK = 500;
const num = (n) => (n || 0).toLocaleString("pt-BR");

// Criar ou renomear um público
function AudienceForm({ audience, onSaved, onCancel }) {
  const [name, setName] = useState(audience?.name || "");
  const [description, setDescription] = useState(audience?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = audience
        ? await AudiencesService.update(audience._id, { name, description })
        : await AudiencesService.create({ name, description });
      onSaved(saved);
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao salvar o público");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-3">
      <h2 className="font-semibold">{audience ? "Editar público" : "Novo público"}</h2>
      <div>
        <label htmlFor="audienceName" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Nome</label>
        <input
          id="audienceName"
          name="audienceName"
          className="input"
          required
          maxLength={80}
          placeholder="Ex.: Clientes da consultoria, Evento SEBRAE 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="audienceDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
          Descrição <span className="font-normal text-gray-400">(opcional: de onde vieram esses contatos)</span>
        </label>
        <input
          id="audienceDescription"
          name="audienceDescription"
          className="input"
          maxLength={300}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Salvando..." : audience ? "Salvar" : "Criar público"}
        </button>
      </div>
    </form>
  );
}

// Resumo do que a importação fez
function ImportResult({ result }) {
  const items = [
    ["Novos assinantes", result.created],
    ["Já eram assinantes, entraram no público", result.added],
    ["Já estavam no público", result.alreadyInList],
    ["Cancelaram a inscrição antes (não recebem)", result.unsubscribed],
  ];
  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-sm">
        {items.map(([label, value]) => (
          <li key={label} className="flex justify-between gap-3">
            <span className="text-gray-600 dark:text-gray-300">{label}</span>
            <span className="font-semibold tabular-nums">{num(value)}</span>
          </li>
        ))}
      </ul>
      {result.invalid.length > 0 && (
        <details className="text-xs text-gray-500 dark:text-gray-300">
          <summary className="cursor-pointer">{result.invalid.length} linha(s) recusadas pelo servidor</summary>
          <ul className="mt-1">
            {result.invalid.map((r) => (
              <li key={`${r.line}-${r.email}`}>Linha {r.line}: {r.email}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * Importar contatos para um público: arquivo .csv/.txt ou texto colado →
 * prévia → confirmação de consentimento → envio em partes.
 */
function ImportModal({ audience, categories, onClose, onDone }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const parsed = parseContacts(text);
  const importing = progress !== null && !result;

  const readFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo grande demais (máx. 5 MB). Divida a lista em partes.");
      return;
    }
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file, "utf-8");
  };

  const runImport = async () => {
    setError(null);
    const rows = parsed.rows;
    const total = { created: 0, added: 0, alreadyInList: 0, unsubscribed: 0, invalid: [] };
    setProgress({ done: 0, total: rows.length });
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const part = await AudiencesService.importRows(audience._id, {
          rows: rows.slice(i, i + CHUNK),
          categories: selectedCats,
          consent: true,
        });
        for (const key of ["created", "added", "alreadyInList", "unsubscribed"]) total[key] += part[key];
        total.invalid.push(...part.invalid);
        setProgress({ done: Math.min(i + CHUNK, rows.length), total: rows.length });
      }
      setResult(total);
      onDone();
    } catch (err) {
      setError(
        `${err?.response?.data?.error || "Erro na importação"}. ${
          total.created + total.added > 0 ? "Parte da lista já foi importada; importar de novo não duplica ninguém." : ""
        }`
      );
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b dark:border-gray-800">
          <div>
            <h2 id="import-title" className="text-lg font-semibold">Importar contatos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">Para o público "{audience.name}"</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <ImportResult result={result} />
            <div className="flex justify-end gap-2">
              <Link to={`/admin/subscribers?list=${audience._id}`} className="px-3 py-2 rounded-lg border text-sm font-medium">
                Ver pessoas do público
              </Link>
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
                <FileUp size={22} />
                <span>{fileName ? `Arquivo: ${fileName}` : "Escolher arquivo .csv ou .txt"}</span>
                <span className="text-xs text-gray-500">Planilha do Excel/Google: Arquivo → Salvar/Baixar como CSV</span>
                <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
              </label>
            </div>

            <div>
              <label htmlFor="importText" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Ou cole a lista
              </label>
              <textarea
                id="importText"
                className="input font-mono text-xs"
                rows={6}
                placeholder={"nome;email\nMaria Souza;maria@empresa.com\nJoão <joao@empresa.com>\npedro@empresa.com"}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setFileName("");
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                Com cabeçalho (colunas "nome" e "email") ou uma pessoa por linha. O nome é opcional.
              </p>
            </div>

            {text.trim() && (
              <div className="rounded-lg border dark:border-gray-800 p-3 space-y-2">
                <p className="text-sm">
                  <strong className="tabular-nums">{num(parsed.rows.length)}</strong> contato(s) válido(s)
                  {parsed.duplicates > 0 && <> · {parsed.duplicates} repetido(s) ignorado(s)</>}
                  {parsed.invalid.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400"> · {parsed.invalid.length} linha(s) sem email válido</span>
                  )}
                </p>
                {parsed.rows.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500"><th className="py-1">Nome</th><th>Email</th></tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((r) => (
                        <tr key={r.email} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="py-1 pr-2">{r.name || <span className="text-gray-400">—</span>}</td>
                          <td className="break-all">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {parsed.rows.length > 5 && <p className="text-xs text-gray-500">e mais {num(parsed.rows.length - 5)}…</p>}
                {parsed.invalid.length > 0 && (
                  <details className="text-xs text-gray-500 dark:text-gray-300">
                    <summary className="cursor-pointer">Ver linhas ignoradas</summary>
                    <ul className="mt-1 space-y-0.5">
                      {parsed.invalid.slice(0, 20).map((r) => (
                        <li key={r.line}>Linha {r.line}: {r.text}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categorias para os novos assinantes <span className="font-normal text-gray-400">(opcional)</span>
              </p>
              <FilterChips options={categories} selected={selectedCats} onChange={setSelectedCats} multiSelect showAll={false} />
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {selectedCats.length
                  ? "Também recebem o aviso de post novo dessas categorias."
                  : "Sem categoria: recebem só os envios feitos para este público, não os avisos de post novo."}{" "}
                Quem já era assinante mantém as próprias categorias.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>
                Confirmo que essas pessoas autorizaram receber meus emails (ex.: se inscreveram num evento, formulário ou são
                clientes que pediram). Mandar email para quem não pediu fere a LGPD e faz o Gmail bloquear o envio. Todo email
                sai com o link de cancelar.
              </span>
            </label>

            {error && (
              <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </p>
            )}

            {importing && (
              <div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 tabular-nums">Importando {num(progress.done)} de {num(progress.total)}…</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={importing} className="px-3 py-2 rounded-lg border text-sm">Cancelar</button>
              <button
                type="button"
                onClick={runImport}
                disabled={!consent || parsed.rows.length === 0 || importing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload size={16} /> Importar {parsed.rows.length > 0 ? num(parsed.rows.length) : ""} contato(s)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Públicos: listas nomeadas de assinantes para mirar envios
 * (ex.: clientes, participantes de um evento).
 */
export default function Audiences() {
  const [audiences, setAudiences] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null); // null | "new" | público
  const [importing, setImporting] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [trashCount, setTrashCount] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(() => {
    AudiencesService.getTrash()
      .then((list) => setTrashCount(list.length))
      .catch(() => {});
    return AudiencesService.getAll()
      .then((list) => {
        setAudiences(list);
        setError(null);
      })
      .catch(() => setError("Erro ao carregar os públicos."));
  }, []);

  useEffect(() => {
    load();
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, [load]);

  const confirmDelete = async () => {
    const audience = toDelete;
    setToDelete(null);
    try {
      await AudiencesService.remove(audience._id);
      await load();
      showToast("Público movido para a lixeira. Dá para restaurar em Lixeira → Públicos.");
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao mover para a lixeira", "error");
    }
  };

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Mover "${toDelete?.name}" para a lixeira?`}
        description="O público sai daqui e dos envios, mas as pessoas continuam como assinantes e ligadas a ele. Restaurar pela Lixeira devolve o público completo."
        confirmText="Mover para a lixeira"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {importing && (
        <ImportModal
          audience={importing}
          categories={categories}
          onClose={() => setImporting(null)}
          onDone={load}
        />
      )}

      <main className="admin-content max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Públicos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Listas de pessoas para mirar envios: importe nomes e emails ou agrupe assinantes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trashCount > 0 && (
              <Link
                to="/admin/trash?tipo=publicos"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Trash2 size={16} /> Lixeira ({trashCount})
              </Link>
            )}
            <button
              type="button"
              onClick={() => setForm(form === "new" ? null : "new")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={16} /> Novo público
            </button>
          </div>
        </div>

        {form && (
          <AudienceForm
            key={form === "new" ? "new" : form._id}
            audience={form === "new" ? null : form}
            onCancel={() => setForm(null)}
            onSaved={(saved) => {
              const isNew = form === "new";
              setForm(null);
              load();
              showToast(isNew ? "Público criado" : "Público atualizado");
              if (isNew) setImporting(saved);
            }}
          />
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!audiences && !error && <p className="text-gray-400">Carregando...</p>}

        {audiences?.length === 0 && !form && (
          <div className="rounded-xl border border-dashed p-10 text-center text-gray-500 dark:text-gray-300">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-700 dark:text-gray-200">Nenhum público ainda</p>
            <p className="text-sm mt-1">Crie um público e importe uma lista de nomes e emails.</p>
          </div>
        )}

        {audiences?.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {audiences.map((a) => (
              <li key={a._id} className="rounded-xl border bg-white dark:bg-gray-900 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{a.name}</h2>
                    {a.description && <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2">{a.description}</p>}
                  </div>
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => setForm(a)} aria-label="Editar" title="Editar" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => setToDelete(a)} aria-label="Mover para a lixeira" title="Mover para a lixeira" className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-sm">
                  <span className="text-2xl font-bold tabular-nums">{num(a.active)}</span>{" "}
                  <span className="text-gray-500 dark:text-gray-300">ativo(s)</span>
                  {a.total > a.active && (
                    <span className="text-xs text-gray-500 dark:text-gray-300"> · {num(a.total - a.active)} cancelado(s)</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => setImporting(a)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    <Upload size={15} /> Importar lista
                  </button>
                  <Link
                    to={`/admin/subscribers?list=${a._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Users size={15} /> Ver pessoas
                  </Link>
                  <Link
                    to="/admin/campaigns/new"
                    state={{ list: a._id }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Novo envio
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-300">
          Em Envios, escolha o público "Públicos" para mandar só para essas pessoas. Quem cancelou a inscrição continua no público,
          mas não recebe nada.
        </p>
      </main>
    </>
  );
}
