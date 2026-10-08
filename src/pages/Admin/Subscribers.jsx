import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, RefreshCw, Users, AlertCircle, Crown, Send, UserPlus } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import FilterChips from "../../components/FilterChips";
import FilterBar from "../../components/FilterBar";
import SubscriberService from "../../services/subscriber.service";

const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "unsubscribed", label: "Cancelados" },
];

const TIER_OPTIONS = [
  { value: "member", label: "Membros" },
  { value: "free", label: "Não membros" },
];

function MemberBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Crown size={12} /> Membro
    </span>
  );
}

function AddSubscriberForm({ onCreated, onCancel }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isMember, setIsMember] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await SubscriberService.createManual({
        email,
        name: name.trim() || undefined,
        tier: isMember ? "member" : "free",
        notes,
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao adicionar assinante.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input type="email" required placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" />
        <input type="text" placeholder="Nome (opcional)" value={name} onChange={(e) => setName(e.target.value)} className="input w-full" />
      </div>
      <input type="text" placeholder="Anotação interna (ex.: pagou via Pix)" value={notes} onChange={(e) => setNotes(e.target.value)} className="input w-full" />
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={isMember} onChange={(e) => setIsMember(e.target.checked)} />
        Membro (recebe conteúdos exclusivos)
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ status }) {
  return status === "active" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      Cancelado
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function Subscribers() {
  const navigate = useNavigate();
  const [data, setData] = useState({ subscribers: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // filtros
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);

  /* --- categorias via API --- */
  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { page, limit: 20 };
    if (statusFilter !== "all") params.status = statusFilter;
    if (tierFilter !== "all") params.tier = tierFilter;
    if (selectedCategories.length) params.categories = selectedCategories.join(",");
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    SubscriberService.getAll(params)
      .then(setData)
      .catch(() => setError("Não foi possível carregar os assinantes."))
      .finally(() => setLoading(false));
  }, [page, statusFilter, tierFilter, selectedCategories, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (setter) => (val) => { setter(val); setPage(1); };

  const clearFilters = () => {
    setStatusFilter("all");
    setTierFilter("all");
    setSelectedCategories([]);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await SubscriberService.remove(id);
      setConfirmDeleteId(null);
      load();
    } catch {
      alert("Erro ao remover assinante.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === "active" ? "unsubscribed" : "active";
    setActionLoading(sub._id);
    try {
      await SubscriberService.update(sub._id, { status: newStatus });
      load();
    } catch {
      alert("Erro ao atualizar status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMember = async (sub) => {
    setActionLoading(sub._id);
    try {
      await SubscriberService.update(sub._id, {
        tier: sub.tier === "member" ? "free" : "member",
      });
      load();
    } catch {
      alert("Erro ao atualizar plano.");
    } finally {
      setActionLoading(null);
    }
  };

  const sendTo = (sub) =>
    navigate("/admin/campaigns/new", {
      state: { subscriber: { _id: sub._id, name: sub.name, email: sub.email, tier: sub.tier } },
    });

  const categoryLabel = (slug) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Heading */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assinantes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {data.total} assinante{data.total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              <UserPlus size={16} /> Adicionar
            </button>
            <button
              onClick={load}
              className="p-2 rounded-lg border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Recarregar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {showAddForm && (
          <AddSubscriberForm
            onCreated={() => { setShowAddForm(false); load(); }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Status chips */}
        <div className="mb-3">
          <FilterChips
            options={STATUS_OPTIONS}
            selected={statusFilter}
            onChange={changeFilter(setStatusFilter)}
            allLabel="Todos"
            multiSelect={false}
          />
        </div>

        {/* Tier chips */}
        <div className="mb-3">
          <FilterChips
            options={TIER_OPTIONS}
            selected={tierFilter}
            onChange={changeFilter(setTierFilter)}
            allLabel="Membros e não membros"
            multiSelect={false}
          />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-3">
            <FilterChips
              options={categories}
              selected={selectedCategories}
              onChange={changeFilter(setSelectedCategories)}
              allLabel="Todas as categorias"
              multiSelect
            />
          </div>
        )}

        {/* Search + date range */}
        <div className="mb-6">
          <FilterBar
            onSearch={changeFilter(setSearch)}
            showDateRange
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={changeFilter(setDateFrom)}
            onDateToChange={changeFilter(setDateTo)}
            onClear={clearFilters}
            searchPlaceholder="Buscar por nome ou email..."
          />
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Tabela */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Plano</th>
                <th className="px-4 py-3 font-semibold">Categorias</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Cadastrado em</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}

              {!loading && data.subscribers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-300">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    Nenhum assinante encontrado.
                  </td>
                </tr>
              )}

              {!loading && data.subscribers.map((sub) => (
                <tr
                  key={sub._id}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                    {sub.name || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sub.email}</td>
                  <td className="px-4 py-3" title={sub.notes || undefined}>
                    {sub.tier === "member" ? <MemberBadge /> : <span className="text-gray-400 text-xs">Gratuito</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sub.categories?.length > 0 ? (
                        sub.categories.map((slug) => (
                          <span
                            key={slug}
                            className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {categoryLabel(slug)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-300 whitespace-nowrap">
                    {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMember(sub)}
                        disabled={actionLoading === sub._id}
                        title={sub.tier === "member" ? "Remover de membros" : "Tornar membro"}
                        className={`p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40 transition ${
                          sub.tier === "member" ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
                        }`}
                      >
                        <Crown size={14} />
                      </button>

                      <button
                        onClick={() => sendTo(sub)}
                        disabled={sub.status !== "active"}
                        title="Enviar conteúdo para este assinante"
                        className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition"
                      >
                        <Send size={14} />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(sub)}
                        disabled={actionLoading === sub._id}
                        title={sub.status === "active" ? "Cancelar inscrição" : "Reativar inscrição"}
                        className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition"
                      >
                        <RefreshCw size={14} />
                      </button>

                      {confirmDeleteId === sub._id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button
                            onClick={() => handleDelete(sub._id)}
                            disabled={actionLoading === sub._id}
                            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(sub._id)}
                          title="Tem certeza que deseja remover este assinante?"
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-300">
            <span>Página {data.page} de {data.totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 rounded border hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
