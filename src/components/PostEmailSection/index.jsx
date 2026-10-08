import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, FlaskConical } from "lucide-react";
import AudiencePicker from "../AudiencePicker";
import RecipientStatus from "../RecipientStatus";
import CampaignService from "../../services/campaign.service";

const defaultSubject = (title) => `Novo artigo: ${title || "título do post"} | marck0101`;

// Mesmo formato do email real: capa, título, chamada e botão
function EmailPreview({ subject, preheader, title, teaser, coverUrl }) {
  const paragraphs = teaser.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
        <p><span className="text-gray-400">Assunto:</span> {subject}</p>
        {preheader && <p className="truncate"><span className="text-gray-400">Prévia:</span> {preheader}</p>}
      </div>
      <div className="bg-[#111827] px-5 py-3 text-white font-bold">marck0101</div>
      <div className="bg-white text-gray-900 px-5 py-5 space-y-3 text-sm">
        <p>Olá, Nome!</p>
        {coverUrl && <img src={coverUrl} alt="" className="w-full rounded" />}
        <h3 className="text-lg font-bold">{title || "Título do post"}</h3>
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-gray-700">{p}</p>
          ))
        ) : (
          <p className="italic text-gray-400">Escreva a chamada ou o resumo do post.</p>
        )}
        <span className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold">
          Continuar lendo no blog →
        </span>
      </div>
    </div>
  );
}

// Resultado do aviso de um post já publicado
function NotificationStatus({ postId }) {
  const [notification, setNotification] = useState(undefined); // undefined = carregando

  useEffect(() => {
    CampaignService.getAll({ post: postId })
      .then((list) => setNotification(list.find((c) => c.kind === "post-notification") ?? null))
      .catch(() => setNotification(null));
  }, [postId]);

  if (notification === undefined) {
    return <p className="text-sm text-gray-400">Carregando aviso...</p>;
  }

  if (!notification) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Este post foi publicado sem aviso por email.{" "}
        <Link to="/admin/campaigns/new" className="text-blue-600 dark:text-blue-400 hover:underline">
          Criar um envio
        </Link>{" "}
        e usar este post.
      </p>
    );
  }

  const { stats } = notification;
  return (
    <div className="flex items-center gap-2 flex-wrap text-sm text-gray-700 dark:text-gray-300">
      {notification.status === "draft" ? (
        <span>Aviso preparado, mas não enviado (rascunho).</span>
      ) : (
        <>
          <RecipientStatus status={stats.failed > 0 ? "failed" : stats.pending > 0 ? "pending" : "sent"} />
          <span>
            {stats.sent} de {stats.total} entregues
            {notification.sentAt && ` em ${new Date(notification.sentAt).toLocaleString("pt-BR")}`}
            {stats.failed > 0 && `, ${stats.failed} falha(s)`}
          </span>
        </>
      )}
      <Link
        to={`/admin/campaigns/${notification._id}`}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Ver envio
      </Link>
    </div>
  );
}

/**
 * Email do post, preparado junto com ele: público, assunto, chamada, prévia e teste.
 * Ao publicar, vira um envio em Envios (aviso automático).
 *
 * value: { emailNotify, emailSubject, emailPreheader, emailTeaser, emailAudience }
 * post:  { _id, title, slug, excerpt, category, coverUrl, coverPreview }
 */
export default function PostEmailSection({ value, onChange, post, categories, alreadyPublished = false }) {
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, message }

  const set = (patch) => onChange(patch);
  const subject = value.emailSubject.trim() || defaultSubject(post.title);
  const preheader = value.emailPreheader.trim() || post.excerpt || "";
  const teaser = value.emailTeaser.trim() || post.excerpt || "";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { message } = await CampaignService.sendPostTest(
        {
          _id: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          category: post.category,
          coverImage: post.coverUrl,
          emailSubject: value.emailSubject,
          emailPreheader: value.emailPreheader,
          emailTeaser: value.emailTeaser,
        },
        testEmail || undefined
      );
      setTestResult({ ok: true, message });
    } catch (err) {
      setTestResult({ ok: false, message: err?.response?.data?.error || "Erro ao enviar teste." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <Mail size={18} /> Email deste post
      </h2>

      {alreadyPublished ? (
        <div className="space-y-2">
          <NotificationStatus postId={post._id} />
          <p className="text-xs text-gray-500 dark:text-gray-300">
            O aviso só sai na primeira publicação. Para mandar de novo ou para outro público, abra o envio e use
            "Reenviar este conteúdo".
          </p>
        </div>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={value.emailNotify}
              onChange={(e) => set({ emailNotify: e.target.checked })}
              className="accent-blue-600"
            />
            Enviar email ao publicar
          </label>

          {!value.emailNotify && (
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Nenhum email automático. Você pode enviar depois por Envios.
            </p>
          )}

          {value.emailNotify && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Para quem?</p>
                <AudiencePicker
                  value={value.emailAudience}
                  onChange={(emailAudience) => set({ emailAudience })}
                  categories={categories}
                  postCategory={post.category}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Assunto</label>
                    <input
                      type="text"
                      value={value.emailSubject}
                      onChange={(e) => set({ emailSubject: e.target.value })}
                      placeholder={defaultSubject(post.title)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Pré-visualização <span className="font-normal text-gray-400">(texto ao lado do assunto)</span>
                    </label>
                    <input
                      type="text"
                      value={value.emailPreheader}
                      onChange={(e) => set({ emailPreheader: e.target.value })}
                      placeholder={post.excerpt || "Se ficar vazio, usa o resumo do post"}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Chamada para o email
                    </label>
                    <textarea
                      rows={5}
                      value={value.emailTeaser}
                      onChange={(e) => set({ emailTeaser: e.target.value })}
                      placeholder={
                        post.excerpt
                          ? "Se ficar vazio, usa o resumo do post."
                          : "Ex.: Você já se perguntou por que seu blog não aparece no Google? Separei os 5 erros mais comuns, e o terceiro quase todo mundo comete…"
                      }
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                      Desperte curiosidade sem entregar o artigo. Use uma linha em branco para separar parágrafos.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email de teste (padrão: o seu)"
                      className="input flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing || !post.title?.trim()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                    >
                      <FlaskConical size={16} /> {testing ? "Enviando..." : "Enviar teste"}
                    </button>
                  </div>
                  {testResult && (
                    <p className={`text-xs ${testResult.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {testResult.message}
                    </p>
                  )}
                  {!post.slug && (
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      O botão do teste só aponta para o blog depois que o post tiver slug (ao salvar).
                    </p>
                  )}
                </div>

                <EmailPreview
                  subject={subject}
                  preheader={preheader}
                  title={post.title}
                  teaser={teaser}
                  coverUrl={post.coverPreview}
                />
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
