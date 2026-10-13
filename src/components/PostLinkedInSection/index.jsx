import { useCallback, useEffect, useRef, useState } from "react";
import { Linkedin, ImagePlus, X, ExternalLink, Pin, RefreshCw } from "lucide-react";
import LinkedInService from "../../services/linkedin.service";
import PostsService from "../../services/posts.service";
import UploadService from "../../services/upload.service";
import { normalizeImageUrl } from "../../utils/imageUrl";

const MAX_CHARS = 3000;
// O feed mostra só o começo do texto; o resto fica atrás do "…mais"
const FOLD_CHARS = 210;
const DEFAULT_COMMENT = "Artigo completo no blog: {link}";

const feedUrl = (postUrn) => `https://www.linkedin.com/feed/update/${postUrn}/`;

// Conexão com o perfil. Conectar abre outra aba para não perder o que está
// sendo escrito; ao voltar para esta aba, o status é recarregado.
function ConnectionBar({ status, onRefresh }) {
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const url = await LinkedInService.getConnectUrl("/admin");
      window.open(url, "_blank", "noopener");
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao conectar com o LinkedIn");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Desconectar o LinkedIn? Posts agendados não sairão no LinkedIn até reconectar.")) return;
    await LinkedInService.disconnect();
    onRefresh();
  };

  if (!status) return <p className="text-sm text-gray-400">Verificando conexão...</p>;

  if (!status.configured) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Integração não configurada no servidor (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET e LINKEDIN_REDIRECT_URI).
      </p>
    );
  }

  if (!status.connected) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-amber-700 dark:text-amber-400">
          {status.expired ? "A conexão com o LinkedIn expirou." : "LinkedIn não conectado."}
        </span>
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a66c2] text-white font-medium hover:bg-[#004182] disabled:opacity-50"
        >
          <Linkedin size={14} /> {status.expired ? "Reconectar" : "Conectar perfil"}
        </button>
      </div>
    );
  }

  const expiring = status.daysLeft <= 7;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      {status.picture && <img src={status.picture} alt="" className="w-6 h-6 rounded-full" />}
      <span>
        Conectado como <strong>{status.name}</strong>
      </span>
      <span className={expiring ? "text-amber-700 dark:text-amber-400" : "text-gray-400"}>
        · expira em {status.daysLeft} dia(s)
      </span>
      {expiring && (
        <button type="button" onClick={connect} className="text-blue-600 dark:text-blue-400 hover:underline">
          Renovar agora
        </button>
      )}
      <button type="button" onClick={disconnect} className="text-gray-400 hover:text-red-600 hover:underline">
        Desconectar
      </button>
    </div>
  );
}

function LinkedInPreview({ account, text, imageUrl, comment, slug }) {
  const [expanded, setExpanded] = useState(false);
  const folded = !expanded && text.length > FOLD_CHARS;
  const link = slug ? `blog.marck0101.com.br/blog/${slug}` : "blog.marck0101.com.br/blog/…";
  const commentShown = (comment.trim() || DEFAULT_COMMENT).replaceAll("{link}", link);

  return (
    <div className="rounded-lg border dark:border-gray-700 overflow-hidden bg-white text-gray-900 text-sm">
      <div className="flex items-center gap-2 px-4 pt-3">
        {account?.picture ? (
          <img src={account.picture} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300" />
        )}
        <div>
          <p className="font-semibold leading-tight">{account?.name || "Seu perfil"}</p>
          <p className="text-xs text-gray-500">agora · 🌐</p>
        </div>
      </div>
      <div className="px-4 py-3 whitespace-pre-line break-words">
        {text ? (
          <>
            {folded ? text.slice(0, FOLD_CHARS).trimEnd() : text}
            {folded && (
              <button type="button" onClick={() => setExpanded(true)} className="text-gray-500 hover:underline">
                …mais
              </button>
            )}
          </>
        ) : (
          <span className="italic text-gray-400">Escreva o texto do post.</span>
        )}
      </div>
      {imageUrl && <img src={imageUrl} alt="" className="w-full" />}
      <div className="border-t px-4 py-3 bg-gray-50 flex gap-2">
        <Pin size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold">{account?.name || "Você"}</p>
          <p className="text-gray-700 break-all">{commentShown}</p>
        </div>
      </div>
    </div>
  );
}

// Resultado no LinkedIn de um artigo já publicado
function ShareStatus({ result, onShareNow, sharing }) {
  if (result?.status === "posted") {
    return (
      <div className="space-y-1 text-sm">
        <p className="text-green-700 dark:text-green-400">
          Publicado no LinkedIn
          {result.postedAt && ` em ${new Date(result.postedAt).toLocaleString("pt-BR")}`}, com o link no comentário.
        </p>
        <a
          href={feedUrl(result.postUrn)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink size={14} /> Abrir no LinkedIn e fixar o comentário
        </a>
      </div>
    );
  }

  if (result?.status === "posting") {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Publicação em andamento. Se ficar parada, confira no LinkedIn antes de tentar de novo.{" "}
        <button type="button" onClick={() => onShareNow()} disabled={sharing} className="underline">
          Tentar de novo
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {result?.status === "failed" && (
        <p className="text-red-600 dark:text-red-400">
          Falhou{result.postUrn ? " no comentário (o post saiu)" : ""}: {result.error}
        </p>
      )}
      <button
        type="button"
        onClick={() => onShareNow()}
        disabled={sharing}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a66c2] text-white font-medium hover:bg-[#004182] disabled:opacity-50"
      >
        <RefreshCw size={14} className={sharing ? "animate-spin" : ""} />
        {sharing ? "Publicando..." : result?.status === "failed" ? "Tentar de novo" : "Publicar no LinkedIn agora"}
      </button>
    </div>
  );
}

/**
 * Post do LinkedIn, preparado junto com o artigo: texto e imagem próprios,
 * link do artigo no 1º comentário. Sai sozinho quando o artigo é publicado.
 *
 * value:  { enabled, text, imageUrl, comment }
 * result: campos do sistema do post salvo { status, postUrn, postedAt, error }
 * post:   { _id, slug, coverPreview }
 */
export default function PostLinkedInSection({ value, onChange, result, onResult, post, alreadyPublished = false }) {
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const inputRef = useRef(null);

  const refreshStatus = useCallback(() => {
    LinkedInService.getStatus().then(setStatus).catch(() => setStatus({ configured: false }));
  }, []);

  useEffect(() => {
    refreshStatus();
    window.addEventListener("focus", refreshStatus);
    return () => window.removeEventListener("focus", refreshStatus);
  }, [refreshStatus]);

  const set = (patch) => onChange({ ...value, ...patch });
  const imageShown = normalizeImageUrl(value.imageUrl) || post.coverPreview || null;

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      set({ imageUrl: await UploadService.uploadCover(file) });
    } catch (err) {
      alert(err?.response?.data?.error || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Artigo já publicado: salva o que está no editor e publica no LinkedIn
  const shareNow = async (force = false) => {
    if (!value.text.trim()) return alert("Escreva o texto do LinkedIn antes.");
    setSharing(true);
    try {
      await PostsService.update(post._id, { linkedin: { ...value, enabled: true } });
      set({ enabled: true });
      const res = await LinkedInService.share(post._id, force);
      onResult({ status: "posted", postUrn: res.postUrn, postedAt: new Date().toISOString(), error: "" });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.needsConfirm) {
        if (confirm(`${data.error}\n\nO post NÃO apareceu no seu perfil? Clique OK para publicar de novo.`)) {
          setSharing(false);
          return shareNow(true);
        }
      } else {
        onResult({ ...result, status: "failed", error: data?.error || "Erro ao publicar no LinkedIn" });
      }
    } finally {
      setSharing(false);
    }
  };

  const posted = result?.status === "posted";
  const showEditor = value.enabled || alreadyPublished;

  return (
    <section className="rounded-xl border bg-white dark:bg-gray-900 p-5 space-y-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <Linkedin size={18} className="text-[#0a66c2]" /> LinkedIn deste post
      </h2>

      <ConnectionBar status={status} onRefresh={refreshStatus} />

      {!alreadyPublished && (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
            className="accent-blue-600"
          />
          Publicar no LinkedIn junto com o artigo
        </label>
      )}

      {showEditor && !posted && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Texto do post</label>
              <textarea
                rows={10}
                value={value.text}
                maxLength={MAX_CHARS}
                onChange={(e) => set({ text: e.target.value })}
                placeholder={"Gancho forte na primeira linha (é o que aparece antes do \"…mais\").\n\nDesenvolva a ideia para quem está no LinkedIn, sem link: ele vai no comentário.\n\n#marketing #trafegopago"}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 flex justify-between gap-2">
                <span>
                  {value.text.length > FOLD_CHARS
                    ? `As primeiras ~${FOLD_CHARS} letras aparecem antes do "…mais".`
                    : "Escreva para o público do LinkedIn; o link vai no comentário."}
                </span>
                <span className={value.text.length > MAX_CHARS - 200 ? "text-orange-500" : ""}>
                  {value.text.length}/{MAX_CHARS}
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagem</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-400 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                >
                  <ImagePlus size={16} />
                  {uploading ? "Enviando..." : value.imageUrl ? "Trocar imagem" : "Imagem própria"}
                </button>
                {value.imageUrl && (
                  <button
                    type="button"
                    onClick={() => set({ imageUrl: "" })}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                  >
                    <X size={14} /> Usar a capa
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {value.imageUrl
                  ? "Imagem própria do LinkedIn."
                  : imageShown
                  ? "Sem imagem própria: usa a capa do artigo."
                  : "Sem imagem: o post sai só com texto."}{" "}
                Formatos que rendem bem: 1200×1200 ou 1080×1350.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImage}
                className="hidden"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Comentário com o link
              </label>
              <input
                type="text"
                value={value.comment}
                onChange={(e) => set({ comment: e.target.value })}
                placeholder={DEFAULT_COMMENT}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {"{link}"} vira o endereço do artigo (com UTM do LinkedIn). A API não fixa comentários: depois de
                publicado, abra o post e fixe pelo menu "…" do comentário.
              </p>
            </div>

            {alreadyPublished && post._id && (
              <ShareStatus result={result} onShareNow={shareNow} sharing={sharing} />
            )}
          </div>

          <LinkedInPreview
            account={status?.connected ? status : null}
            text={value.text}
            imageUrl={imageShown}
            comment={value.comment}
            slug={post.slug}
          />
        </div>
      )}

      {posted && <ShareStatus result={result} />}

      {!alreadyPublished && result?.status === "failed" && (
        <p className="text-sm text-red-600 dark:text-red-400">Última tentativa falhou: {result.error}</p>
      )}
    </section>
  );
}
