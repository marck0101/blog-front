import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Send, FlaskConical, Save, Trash2, X, Crown, Copy, RotateCcw, UserPlus } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import RichTextEditor from "../../components/RichTextEditor";
import FilterChips from "../../components/FilterChips";
import ConfirmDialog from "../../components/ConfirmDialog";
import CampaignService from "../../services/campaign.service";
import SubscriberService from "../../services/subscriber.service";
import { AUDIENCE_LABELS } from "../../utils/campaignAudience";

const AUDIENCE_HINTS = {
  members: "Só assinantes ativos marcados como membro.",
  all: "Todos os assinantes ativos, membros ou não.",
  categories: "Assinantes ativos que seguem ao menos uma das categorias.",
  selected: "Apenas as pessoas que você escolher abaixo.",
};

const errorMessage = (err, fallback) => err?.response?.data?.error || fallback;

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

function SendReport({ campaign, busy, onResume, onRetryFailed, onDuplicate }) {
  const { stats } = campaign;
  const failed = (campaign.recipients || []).filter((r) => r.status === "failed");
  const btn =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Destinatários", stats.total],
          ["Enviados", stats.sent],
          ["Pendentes", stats.pending],
          ["Falhas", stats.failed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-300">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {campaign.status === "sending" && (
        <button
          onClick={onResume}
          disabled={Boolean(busy)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Send size={16} /> {busy === "send" ? "Enviando..." : "Continuar envio"}
        </button>
      )}

      {campaign.status === "sent" && (
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reenviar este conteúdo</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onDuplicate("new-members")} disabled={Boolean(busy)} className={btn}>
              <UserPlus size={16} /> Para membros que ainda não receberam
            </button>
            <button onClick={() => onDuplicate("copy")} disabled={Boolean(busy)} className={btn}>
              <Copy size={16} /> Escolher outro público
            </button>
            {stats.failed > 0 && (
              <button onClick={onRetryFailed} disabled={Boolean(busy)} className={btn}>
                <RotateCcw size={16} /> {busy === "send" ? "Enviando..." : `Tentar de novo as ${stats.failed} falha(s)`}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-300">
            As duas primeiras opções criam um rascunho novo, que você revisa antes de enviar.
          </p>
        </div>
      )}

      {failed.length > 0 && (
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Falhas</p>
          <ul className="text-sm space-y-1">
            {failed.map((r) => (
              <li key={r.email} className="text-gray-600 dark:text-gray-300">
                {r.email} <span className="text-xs text-red-500">— {r.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Atalho vindo da tela de assinantes: já abre com a pessoa selecionada
  const preselected = location.state?.subscriber;

  const [campaign, setCampaign] = useState(null);
  const [form, setForm] = useState({
    subject: "",
    preheader: "",
    content: "",
    audienceType: preselected ? "selected" : "members",
    categories: [],
    subscribers: preselected ? [preselected] : [],
  });
  const [categories, setCategories] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(null); // "save" | "test" | "send" | "delete"
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDraft = !campaign || campaign.status === "draft";

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    CampaignService.getById(id)
      .then((c) => {
        setCampaign(c);
        setForm({
          subject: c.subject,
          preheader: c.preheader || "",
          content: c.content || "",
          audienceType: c.audience?.type || "members",
          categories: c.audience?.categories || [],
          subscribers: c.audience?.subscribers || [],
        });
      })
      .catch(() => setError("Envio não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  const audience = {
    type: form.audienceType,
    categories: form.categories,
    subscribers: form.subscribers.map((s) => s._id),
  };
  const audienceKey = JSON.stringify(audience);

  useEffect(() => {
    if (!isDraft) return;
    const t = setTimeout(() => {
      CampaignService.audienceCount(JSON.parse(audienceKey))
        .then(setAudienceCount)
        .catch(() => setAudienceCount(null));
    }, 300);
    return () => clearTimeout(t);
  }, [audienceKey, isDraft]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Salva e devolve o id (cria na primeira vez)
  const save = async () => {
    const payload = {
      subject: form.subject,
      preheader: form.preheader,
      content: form.content,
      audience,
    };

    if (campaign?._id) {
      const updated = await CampaignService.update(campaign._id, payload);
      setCampaign((c) => ({ ...c, ...updated }));
      return campaign._id;
    }

    const created = await CampaignService.create(payload);
    setCampaign(created);
    navigate(`/admin/campaigns/${created._id}`, { replace: true });
    return created._id;
  };

  const run = async (kind, fn) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err, "Algo deu errado. Tente novamente."));
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () =>
    run("save", async () => {
      await save();
      setNotice("Rascunho salvo.");
    });

  const handleTest = () =>
    run("test", async () => {
      const campaignId = await save();
      const { message } = await CampaignService.sendTest(campaignId, testEmail || undefined);
      setNotice(message);
    });

  const sendAll = async (campaignId) => {
    let result = await CampaignService.sendBatch(campaignId);
    setCampaign(result);
    while (result.status === "sending" && result.stats.pending > 0) {
      result = await CampaignService.sendBatch(campaignId);
      setCampaign(result);
    }
    const full = await CampaignService.getById(campaignId);
    setCampaign(full);
    setNotice(`Envio concluído: ${full.stats.sent} de ${full.stats.total} entregues.`);
  };

  const handleSend = () => {
    setConfirmSend(false);
    run("send", async () => {
      const campaignId = await save();
      await sendAll(campaignId);
    });
  };

  const handleResume = () => run("send", () => sendAll(campaign._id));

  const handleRetryFailed = () =>
    run("send", async () => {
      setCampaign(await CampaignService.retryFailed(campaign._id));
      await sendAll(campaign._id);
    });

  const handleDuplicate = (mode) =>
    run("duplicate", async () => {
      const copy = await CampaignService.duplicate(campaign._id, mode);
      navigate(`/admin/campaigns/${copy._id}`);
    });

  const handleDelete = () => {
    setConfirmDelete(false);
    run("delete", async () => {
      await CampaignService.remove(campaign._id);
      navigate("/admin/campaigns");
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-5xl mx-auto px-6 py-10 text-gray-400">Carregando...</main>
      </>
    );
  }

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      <main className="admin-content max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Link to="/admin/campaigns" className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para envios
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isDraft ? (campaign ? "Editar envio" : "Novo envio") : campaign.subject}
          </h1>
          {!isDraft && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {AUDIENCE_LABELS[campaign.audience?.type]}
              {campaign.sentAt && ` · enviado em ${new Date(campaign.sentAt).toLocaleString("pt-BR")}`}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        {notice && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
            {notice}
          </div>
        )}

        {!isDraft && (
          <>
            <SendReport
              campaign={campaign}
              busy={busy}
              onResume={handleResume}
              onRetryFailed={handleRetryFailed}
              onDuplicate={handleDuplicate}
            />
            <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
              />
            </div>
          </>
        )}

        {isDraft && (
          <>
            {/* Público */}
            <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Para quem?</h2>

              <FilterChips
                options={Object.entries(AUDIENCE_LABELS).map(([slug, label]) => ({ slug, label }))}
                selected={form.audienceType}
                onChange={set("audienceType")}
                multiSelect={false}
                showAll={false}
              />
              <p className="text-sm text-gray-500 dark:text-gray-300">{AUDIENCE_HINTS[form.audienceType]}</p>

              {form.audienceType === "categories" && (
                <FilterChips
                  options={categories}
                  selected={form.categories}
                  onChange={set("categories")}
                  multiSelect
                  showAll={false}
                />
              )}

              {form.audienceType === "selected" && (
                <SubscriberPicker selected={form.subscribers} onChange={set("subscribers")} />
              )}

              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {audienceCount === null
                  ? "Calculando destinatários..."
                  : `${audienceCount} destinatário${audienceCount !== 1 ? "s" : ""}`}
              </p>
            </section>

            {/* Conteúdo */}
            <section className="space-y-4">
              <input
                type="text"
                value={form.subject}
                onChange={(e) => set("subject")(e.target.value)}
                placeholder="Assunto do email"
                className="input w-full text-lg"
              />
              <input
                type="text"
                value={form.preheader}
                onChange={(e) => set("preheader")(e.target.value)}
                placeholder="Pré-visualização (texto curto que aparece na caixa de entrada, opcional)"
                className="input w-full"
              />
              <RichTextEditor value={form.content} onChange={set("content")} />
            </section>

            {/* Ações */}
            <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Email de teste (padrão: o seu)"
                  className="input flex-1 min-w-0"
                />
                <button
                  onClick={handleTest}
                  disabled={busy || !form.subject.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  <FlaskConical size={16} /> {busy === "test" ? "Enviando..." : "Enviar teste"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {campaign?._id && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                    className="mr-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
                  >
                    <Trash2 size={16} /> Excluir rascunho
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={busy || !form.subject.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  <Save size={16} /> {busy === "save" ? "Salvando..." : "Salvar rascunho"}
                </button>
                <button
                  onClick={() => setConfirmSend(true)}
                  disabled={busy || !form.subject.trim() || !form.content.trim() || !audienceCount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Send size={16} /> {busy === "send" ? "Enviando..." : "Enviar agora"}
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <ConfirmDialog
        open={confirmSend}
        title="Enviar agora?"
        description={`O email "${form.subject}" será enviado para ${audienceCount} destinatário(s). Não dá para desfazer.`}
        confirmText="Enviar"
        type="info"
        onConfirm={handleSend}
        onCancel={() => setConfirmSend(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir rascunho?"
        confirmText="Excluir"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
