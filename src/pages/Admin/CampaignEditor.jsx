import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Send, FlaskConical, Save, Trash2, X, Crown, Copy, RotateCcw, UserPlus, FileText, Download } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import RichTextEditor from "../../components/RichTextEditor";
import FilterChips from "../../components/FilterChips";
import ConfirmDialog from "../../components/ConfirmDialog";
import RecipientsTable from "../../components/RecipientsTable";
import CampaignService from "../../services/campaign.service";
import SubscriberService from "../../services/subscriber.service";
import PostsService from "../../services/posts.service";
import AudiencePicker from "../../components/AudiencePicker";
import {
  CAMPAIGN_STATUS,
  audienceLabel,
  campaignStatusKey,
  audienceToApi,
  emptyAudience,
} from "../../utils/campaignAudience";


const POST_STATUS_LABELS = { published: "Publicado", draft: "Rascunho", planned: "Planejado" };

function PostStatusBadge({ post }) {
  const status = post.published ? "published" : post.status || "draft";
  const styles = {
    published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    planned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {POST_STATUS_LABELS[status]}
    </span>
  );
}

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const coverHtml = (post) =>
  post.coverImage
    ? `<p><img src="${escapeHtml(post.coverImage)}" alt="" style="width: 100%; height: auto; display: block;"></p>`
    : "";

// Chamada do post (mesmo formato do aviso automático no backend): capa, título
// e a chamada do email — o botão "Continuar lendo no blog" vem do template.
function postTeaserContent(post) {
  const teaser = (post.emailTeaser || "").trim() || post.excerpt || "";
  const paragraphs = teaser
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `${coverHtml(post)}<h2>${escapeHtml(post.title)}</h2>${paragraphs}`;
}

// Artigo inteiro no email (ex.: rascunho exclusivo para membros)
const postFullContent = (post) => coverHtml(post) + (post.content || "");

function PostPicker({ linkedPost, onPick, onUnlink, onUseFull }) {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      PostsService.getAll(1, 10, { search })
        .then((data) => setPosts(data.posts))
        .catch(() => setPosts([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  if (linkedPost) {
    return (
      <div className="flex items-center gap-2 flex-wrap rounded-lg border dark:border-gray-700 px-3 py-2 text-sm">
        <FileText size={16} className="text-gray-400" />
        <span className="text-gray-500 dark:text-gray-300">Baseado no post:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{linkedPost.title}</span>
        <PostStatusBadge post={linkedPost} />
        <span className="text-xs text-gray-500 dark:text-gray-300">
          {linkedPost.published
            ? "O email terá o botão \"Continuar lendo no blog\"."
            : "Ainda não publicado: sem botão para o blog até ele ser publicado."}
        </span>
        <button
          type="button"
          onClick={onUseFull}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          title="Coloca o artigo inteiro no email, em vez da chamada"
        >
          Usar texto completo
        </button>
        <button
          type="button"
          onClick={onUnlink}
          className="ml-auto text-xs text-gray-500 hover:text-red-600"
          title="Desvincular (mantém o texto)"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Usar um post do blog (publicado ou rascunho)... busque pelo título"
        className="input w-full"
      />
      {open && posts.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-lg max-h-72 overflow-auto">
          {posts.map((post) => (
            <li key={post._id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                  onPick(post);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <PostStatusBadge post={post} />
                <span className="text-gray-900 dark:text-gray-100 truncate">{post.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const errorMessage = (err, fallback) => err?.response?.data?.error || fallback;

function SendReport({ campaign, busy, onResume, onRetryFailed, onDuplicate }) {
  const { stats } = campaign;
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

      <RecipientsTable campaign={campaign} />
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
    audience: preselected
      ? { ...emptyAudience("selected"), subscribers: [preselected] }
      : emptyAudience("members"),
    post: null,
  });
  const [pendingPost, setPendingPost] = useState(null); // post aguardando confirmação para substituir o texto
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
          audience: {
            type: c.audience?.type || "members",
            categories: c.audience?.categories || [],
            subscribers: c.audience?.subscribers || [],
            excludeMembers: Boolean(c.audience?.excludeMembers),
          },
          post: c.post || null,
        });
      })
      .catch(() => setError("Envio não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  const audience = audienceToApi(form.audience);
  // Chamada de post sem página no blog: o email sai sem botão
  const unpublishedPost = Boolean(form.post && !form.post.published);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Salva e devolve o id (cria na primeira vez)
  const save = async () => {
    const payload = {
      subject: form.subject,
      preheader: form.preheader,
      content: form.content,
      audience,
      post: form.post?._id ?? null,
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
    const { sent, failed, total } = full.stats;
    if (failed > 0) {
      setError(
        sent === 0
          ? `Nenhum email foi entregue (${failed} falha${failed !== 1 ? "s" : ""}). Veja o motivo na lista de destinatários.`
          : `Envio parcial: ${sent} de ${total} entregues, ${failed} não enviado${failed !== 1 ? "s" : ""}.`
      );
    } else {
      setNotice(`Envio concluído: ${sent} de ${total} entregues.`);
    }
  };

  const handleSend = () => {
    setConfirmSend(false);
    run("send", async () => {
      const campaignId = await save();
      await sendAll(campaignId);
    });
  };

  // mode "teaser" troca assunto + texto pela chamada; "full" troca só o texto pelo artigo inteiro
  const applyPost = ({ post, mode }) => {
    setPendingPost(null);
    if (mode === "full") {
      setForm((f) => ({ ...f, post, content: postFullContent(post) }));
      return;
    }
    setForm((f) => ({
      ...f,
      post,
      subject: post.title,
      preheader: post.excerpt || "",
      content: postTeaserContent(post),
    }));
  };

  const loadPost = async (postId, mode, mustConfirm) => {
    setError(null);
    try {
      const post = await PostsService.getById(postId);
      if (mustConfirm) setPendingPost({ post, mode });
      else applyPost({ post, mode });
    } catch {
      setError("Não foi possível carregar o post.");
    }
  };

  const handlePickPost = (summary) =>
    loadPost(summary._id, "teaser", Boolean(form.content.trim() || form.subject.trim()));

  const handleUseFullPost = () => loadPost(form.post._id, "full", Boolean(form.content.trim()));

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
            {!isDraft && (
              <span
                className={`ml-3 align-middle inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CAMPAIGN_STATUS[campaignStatusKey(campaign)].style}`}
              >
                {CAMPAIGN_STATUS[campaignStatusKey(campaign)].label}
              </span>
            )}
          </h1>
          {!isDraft && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {campaign.kind === "post-notification" && "Aviso automático de post novo · "}
              {audienceLabel(campaign.audience)}
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

              <AudiencePicker
                value={form.audience}
                onChange={set("audience")}
                categories={categories}
                onPreview={(p) => setAudienceCount(p.count)}
              />
            </section>

            {/* Conteúdo */}
            <section className="space-y-4">
              <PostPicker
                linkedPost={form.post}
                onPick={handlePickPost}
                onUnlink={() => set("post")(null)}
                onUseFull={handleUseFullPost}
              />
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
              {unpublishedPost && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      O post "{form.post.title}" ainda não foi publicado.
                    </p>
                    <p className="mt-1">
                      O email vai sair <strong>sem o botão "Continuar lendo no blog"</strong>, porque a página do
                      post ainda não existe. Publique o post antes de enviar, ou use "Usar texto completo" para
                      mandar o artigo inteiro no email.
                    </p>
                  </div>
                </div>
              )}
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
        description={
          `O email "${form.subject}" será enviado para ${audienceCount} destinatário(s). Não dá para desfazer.` +
          (unpublishedPost
            ? ` Atenção: o post ainda não foi publicado, então o email vai SEM o botão para o blog.`
            : "")
        }
        confirmText="Enviar"
        type="info"
        onConfirm={handleSend}
        onCancel={() => setConfirmSend(false)}
      />
      <ConfirmDialog
        open={Boolean(pendingPost)}
        title="Substituir o conteúdo atual?"
        description={
          pendingPost?.mode === "full"
            ? `O texto atual será trocado pelo artigo completo "${pendingPost?.post.title}".`
            : `O assunto, a pré-visualização e o texto serão trocados pela chamada do post "${pendingPost?.post.title}".`
        }
        confirmText="Substituir"
        type="warning"
        onConfirm={() => applyPost(pendingPost)}
        onCancel={() => setPendingPost(null)}
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
