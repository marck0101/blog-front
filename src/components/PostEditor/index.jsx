import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import slugify from "slugify";
import { ArrowLeft, Eye, X } from "lucide-react";
import Header from "../Header";
import SEO from "../SEO";
import PostEmailSection from "../PostEmailSection";
import PostLinkedInSection from "../PostLinkedInSection";
import PostStatusField from "../PostStatusField";
import RichTextEditor from "../RichTextEditor";
import ImageManager from "../ImageManager";
import CoverImageUpload from "../CoverImageUpload";
import FilterChips from "../FilterChips";
import SeasonFields from "../SeasonFields";
import PostSkeleton from "../PostSkeleton";
import ConfirmDialog from "../ConfirmDialog";
import PostsService from "../../services/posts.service";
import UploadService from "../../services/upload.service";
import SubscriberService from "../../services/subscriber.service";
import { emptyLinkedIn } from "../../utils/linkedin";
import { audienceToApi, emptyAudience } from "../../utils/campaignAudience";
import { readingMinutes } from "../../utils/readingTime";
import { SITE_URL } from "../../seo/site";

const AUTOSAVE_MS = 30_000;
const draftKey = (postId) => `post-draft:${postId || "new"}`;

const emptyForm = (plannedAt = "") => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  // Sem categoria pré-escolhida: obrigatória, para o post não sair na errada
  category: "",
  season: "",
  seasonOrder: "",
  status: "draft",
  plannedAt,
  emailNotify: true,
  emailTeaser: "",
  emailSubject: "",
  emailPreheader: "",
  emailAudience: emptyAudience("post-category"),
  linkedin: emptyLinkedIn(),
  seo: { title: "", description: "" },
});

function formFromPost(post) {
  return {
    title: post.title || "",
    slug: post.slug || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    category: post.category || "",
    season: post.season || "",
    seasonOrder: post.seasonOrder ?? "",
    status: post.status || (post.published ? "published" : "draft"),
    plannedAt: post.plannedAt ? new Date(post.plannedAt).toISOString().split("T")[0] : "",
    emailNotify: post.emailNotify !== false,
    emailTeaser: post.emailTeaser || "",
    emailSubject: post.emailSubject || "",
    emailPreheader: post.emailPreheader || "",
    emailAudience: {
      ...emptyAudience("post-category"),
      ...post.emailAudience,
      subscribers: post.emailAudience?.subscribers || [],
      lists: post.emailAudience?.lists || [],
    },
    linkedin: {
      enabled: post.linkedin?.enabled === true,
      text: post.linkedin?.text || "",
      imageUrl: post.linkedin?.imageUrl || "",
      comment: post.linkedin?.comment || "",
    },
    seo: { title: post.seo?.title || "", description: post.seo?.description || "" },
  };
}

// Mesma regra do backend (slugify strict, minúsculas)
const slugPreview = (title) => slugify(title || "", { lower: true, strict: true });

function readDraft(postId) {
  try {
    const raw = localStorage.getItem(draftKey(postId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeDraft(postId, data) {
  try {
    localStorage.setItem(draftKey(postId), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
function clearDraft(postId) {
  try {
    localStorage.removeItem(draftKey(postId));
  } catch {
    /* sem localStorage */
  }
}

const timeLabel = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Prévia do post como o leitor vai ver (título, metadados e texto) */
function PostPreview({ form, categoryLabel, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-stretch sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Pré-visualização do post">
      <div className="bg-white dark:bg-gray-950 w-full max-w-4xl sm:rounded-xl flex flex-col max-h-full">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <p className="text-sm text-gray-500 dark:text-gray-300">Pré-visualização · não salva nada</p>
          <button type="button" onClick={onClose} aria-label="Fechar pré-visualização" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-8">
          <article className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{form.title || "Sem título"}</h1>
            <p className="text-gray-500 dark:text-gray-300 mt-2">
              {categoryLabel || "Sem categoria"} • {new Date().toLocaleDateString("pt-BR")} • {readingMinutes(form.content)} min de leitura
            </p>
            <div
              className="post-content prose prose-lg max-w-none mt-8 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: form.content || "<p><em>Sem conteúdo ainda.</em></p>" }}
            />
          </article>
        </div>
      </div>
    </div>
  );
}

/**
 * Editor de post (criar e editar). postId vazio = post novo.
 * - aviso ao sair com alterações não salvas (navegação interna e fechar aba)
 * - rascunho local a cada 30 s (neste navegador), oferecido para restaurar
 * - barra fixa com Salvar / Pré-visualizar e atalho Ctrl+S
 * - confirmação antes de publicar com email ("enviar para N pessoas?")
 */
export default function PostEditor({ postId, initialPlannedAt = "" }) {
  const navigate = useNavigate();
  const isNew = !postId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(() => emptyForm(initialPlannedAt));
  const [gallery, setGallery] = useState([]);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [categories, setCategories] = useState([]);
  // Já estava publicado ao abrir: o aviso automático não sai de novo
  const [wasPublished, setWasPublished] = useState(false);
  // Resultado no LinkedIn (status, postUrn, erro), gravado pelo servidor
  const [linkedinResult, setLinkedinResult] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Rascunho local mais novo que o salvo, oferecido ao abrir
  const [pendingDraft, setPendingDraft] = useState(null);
  const [localSavedAt, setLocalSavedAt] = useState(null);

  // Estado salvo (no servidor) para comparar e saber se há alterações
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ form: emptyForm(initialPlannedAt), coverImage: "", gallery: [] })
  );
  const snapshot = useMemo(() => JSON.stringify({ form, coverImage, gallery }), [form, coverImage, gallery]);
  const dirty = !loading && (snapshot !== savedSnapshot || Boolean(coverFile));

  // Capa para a prévia do email (arquivo ainda não enviado vira URL local)
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : coverImage),
    [coverFile, coverImage]
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  /* LOAD */
  useEffect(() => {
    if (isNew) {
      const draft = readDraft(null);
      if (draft) setPendingDraft(draft);
      return;
    }
    PostsService.getById(postId)
      .then((post) => {
        if (!post) throw new Error("Post não encontrado");
        const loaded = formFromPost(post);
        setForm(loaded);
        setWasPublished(loaded.status === "published");
        setLinkedinResult(post.linkedin || null);
        setGallery(post.gallery || []);
        setCoverImage(post.coverImage || "");
        const snap = JSON.stringify({ form: loaded, coverImage: post.coverImage || "", gallery: post.gallery || [] });
        setSavedSnapshot(snap);

        // Rascunho local só interessa se for mais novo que a última gravação e diferente
        const draft = readDraft(postId);
        const savedAt = new Date(post.updatedAt || 0).getTime();
        if (draft && new Date(draft.savedAt).getTime() > savedAt &&
            JSON.stringify({ form: draft.form, coverImage: draft.coverImage, gallery: draft.gallery }) !== snap) {
          setPendingDraft(draft);
        } else if (draft) {
          clearDraft(postId);
        }
      })
      .catch(() => {
        showToast("Erro ao carregar post", "error");
        navigate("/admin/posts");
      })
      .finally(() => setLoading(false));
  }, [postId, isNew, navigate, showToast]);

  /* RASCUNHO LOCAL: a cada 30 s, se houver alteração */
  const latest = useRef({ form, coverImage, gallery, dirty });
  useEffect(() => {
    latest.current = { form, coverImage, gallery, dirty };
  });
  useEffect(() => {
    if (loading || pendingDraft) return;
    const timer = setInterval(() => {
      const { form: f, coverImage: c, gallery: g, dirty: d } = latest.current;
      if (!d) return;
      const savedAt = new Date().toISOString();
      if (writeDraft(postId, { savedAt, form: f, coverImage: c, gallery: g })) setLocalSavedAt(savedAt);
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [loading, pendingDraft, postId]);

  const restoreDraft = () => {
    setForm({ ...emptyForm(), ...pendingDraft.form });
    setCoverImage(pendingDraft.coverImage || "");
    setGallery(pendingDraft.gallery || []);
    setPendingDraft(null);
  };
  const discardDraft = () => {
    clearDraft(postId);
    setPendingDraft(null);
  };

  /* AVISO AO SAIR */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname
  );
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* SALVAR */
  const willSendEmail = form.status === "published" && !wasPublished && form.emailNotify;

  const save = async () => {
    if (!form.title.trim()) return showToast("Escreva o título do post", "error");
    if (!form.category) return showToast("Escolha a categoria do post", "error");
    if (form.status === "planned" && !form.plannedAt) {
      return showToast("Escolha a data de publicação do post agendado", "error");
    }

    try {
      setSaving(true);
      const finalCoverUrl = coverFile ? await UploadService.uploadCover(coverFile) : coverImage;
      const payload = {
        ...form,
        emailAudience: audienceToApi(form.emailAudience),
        published: form.status === "published",
        // Rascunho guarda a data do calendário; agendado, a data de publicação
        plannedAt: form.status === "published" ? null : form.plannedAt || null,
        gallery: gallery.filter(Boolean),
        coverImage: finalCoverUrl || "",
      };
      const saved = isNew ? await PostsService.create(payload) : await PostsService.update(postId, payload);

      // O servidor pode ter gerado o slug: o formulário passa a refletir o salvo
      const nextForm = { ...form, slug: saved?.slug || form.slug };
      setForm(nextForm);
      setCoverImage(finalCoverUrl || "");
      setCoverFile(null);
      setSavedSnapshot(JSON.stringify({ form: nextForm, coverImage: finalCoverUrl || "", gallery }));
      if (form.status === "published") setWasPublished(true);
      if (saved?.linkedin) setLinkedinResult(saved.linkedin);
      clearDraft(postId);
      setLocalSavedAt(null);

      showToast(
        form.status === "published" ? (wasPublished ? "Post atualizado" : "Post publicado") :
        form.status === "planned" ? "Post agendado" : "Rascunho salvo"
      );

      // Post novo: segue editando no endereço dele
      if (isNew && saved?._id) {
        clearDraft(null);
        navigate(`/admin/posts/${saved._id}`, { replace: true });
      }
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    if (saving) return;
    if (willSendEmail) setConfirmPublish(true);
    else save();
  };

  // Ctrl+S / Cmd+S
  const requestSaveRef = useRef(requestSave);
  useEffect(() => {
    requestSaveRef.current = requestSave;
  });
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        requestSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const categoryLabel = categories.find((c) => c.slug === form.category)?.label;
  const urlSlug = form.slug || slugPreview(form.title);

  const saveLabel = saving ? "Salvando..." :
    form.status === "published" ? (wasPublished ? "Salvar alterações" : "Publicar") :
    form.status === "planned" ? "Agendar publicação" : "Salvar rascunho";

  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6">Carregando post...</h1>
          {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
        </main>
      </>
    );
  }

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />

      {toast && (
        <div className={`fixed top-6 right-6 z-[70] px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-28">
        <Link to="/admin/posts" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300 hover:underline">
          <ArrowLeft size={14} /> Posts
        </Link>
        <h1 className="text-2xl font-bold mt-2 mb-6">{isNew ? "Novo post" : "Editar post"}</h1>

        {pendingDraft && (
          <div className="mb-6 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-sm text-amber-900 dark:text-amber-200">
            <span className="flex-1 min-w-0">
              Há alterações não salvas de {new Date(pendingDraft.savedAt).toLocaleString("pt-BR")} neste navegador.
              {" "}A imagem de capa nova, se havia, precisa ser escolhida de novo.
            </span>
            <button type="button" onClick={restoreDraft} className="px-3 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700">
              Restaurar
            </button>
            <button type="button" onClick={discardDraft} className="px-3 py-1.5 rounded-md border border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40">
              Descartar
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          {/* PRINCIPAL: título, endereço, resumo, conteúdo */}
          <div className="space-y-6 min-w-0">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input id="title" name="title"
                className="input text-lg"
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-300 break-all">
                {SITE_URL.replace(/^https?:\/\//, "")}/blog/<span className="font-mono text-gray-800 dark:text-gray-100">{urlSlug || "…"}</span>
                {!form.slug && urlSlug && <span className="text-gray-400"> (gerado ao salvar)</span>}
              </p>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-300 select-none">
                Editar endereço (slug)
              </summary>
              <input id="slug" name="slug"
                aria-label="Slug"
                className="input mt-2 font-mono text-sm"
                placeholder={slugPreview(form.title) || "gerado a partir do título"}
                value={form.slug}
                onChange={(e) => set({ slug: e.target.value })}
              />
              {wasPublished && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Post publicado: mudar o endereço quebra links já compartilhados.
                </p>
              )}
            </details>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resumo
              </label>
              <div className="relative">
                <textarea id="excerpt" name="excerpt"
                  className="input"
                  placeholder="Aparece nos cards e no Google (máx. 160 caracteres)"
                  value={form.excerpt}
                  maxLength={160}
                  rows={3}
                  onChange={(e) => set({ excerpt: e.target.value.slice(0, 160) })}
                />
                <span className={`absolute bottom-2 right-3 text-xs ${
                  form.excerpt.length === 160 ? "text-red-500" : form.excerpt.length > 140 ? "text-orange-500" : "text-gray-400"
                }`}>
                  {form.excerpt.length}/160
                </span>
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo</p>
              <RichTextEditor value={form.content} onChange={(content) => set({ content })} />
            </div>

            <CoverImageUpload
              existingUrl={coverImage}
              onFileSelect={(file) => {
                setCoverFile(file);
                if (!file) setCoverImage("");
              }}
            />

            <ImageManager images={gallery} setImages={setGallery} coverImage={coverImage} setCoverImage={setCoverImage} />

            <section className="rounded-lg border p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
              <h2 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-300">SEO</h2>
              <label htmlFor="seoTitle" className="block text-xs text-gray-600 dark:text-gray-300">Título SEO (meta title)</label>
              <input id="seoTitle" name="seoTitle"
                className="input"
                placeholder={form.title}
                value={form.seo.title}
                onChange={(e) => set({ seo: { ...form.seo, title: e.target.value } })}
              />
              <label htmlFor="seoDescription" className="block text-xs text-gray-600 dark:text-gray-300">Descrição SEO (meta description)</label>
              <textarea id="seoDescription" name="seoDescription"
                className="input"
                placeholder={form.excerpt}
                value={form.seo.description}
                onChange={(e) => set({ seo: { ...form.seo, description: e.target.value } })}
              />
              <p className="text-xs text-gray-500">Caso vazio, o título e o resumo do post são usados automaticamente.</p>
            </section>

            <PostEmailSection
              value={form}
              onChange={set}
              post={{
                _id: postId,
                title: form.title,
                slug: form.slug,
                excerpt: form.excerpt,
                category: form.category,
                coverUrl: coverImage,
                coverPreview,
              }}
              categories={categories}
              alreadyPublished={wasPublished}
              onRecipientsChange={setRecipients}
            />

            <PostLinkedInSection
              value={form.linkedin}
              onChange={(linkedin) => set({ linkedin })}
              result={linkedinResult}
              onResult={setLinkedinResult}
              post={{ _id: postId, title: form.title, slug: form.slug, coverPreview }}
              alreadyPublished={wasPublished}
            />
          </div>

          {/* LATERAL: publicação e organização */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-xl border bg-white dark:bg-gray-900 p-4">
              <PostStatusField
                status={form.status}
                plannedAt={form.plannedAt}
                onChange={set}
                publishLabel={wasPublished ? "Publicado" : "Publicar agora"}
                postId={postId}
                alreadyPublished={wasPublished}
                stacked
              />
            </div>

            <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria <span className="text-red-500">*</span>
                </p>
                <FilterChips
                  options={categories}
                  selected={form.category}
                  onChange={(val) => set({ category: val })}
                  multiSelect={false}
                  showAll={false}
                />
              </div>
              <SeasonFields
                season={form.season}
                seasonOrder={form.seasonOrder}
                onChange={set}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* BARRA FIXA */}
      <div className="admin-fixed-bar fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 dark:bg-gray-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <p className="flex-1 min-w-0 truncate text-xs text-gray-500 dark:text-gray-300" aria-live="polite">
            {dirty
              ? localSavedAt
                ? `Alterações não salvas · cópia local às ${timeLabel(localSavedAt)}`
                : "Alterações não salvas"
              : "Tudo salvo"}
            <span className="hidden sm:inline text-gray-400"> · Ctrl+S salva</span>
          </p>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Eye size={16} /> <span className="hidden sm:inline">Pré-visualizar</span>
          </button>
          <button
            type="button"
            onClick={requestSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-60 ${
              form.status === "published" ? "bg-green-600 hover:bg-green-700" :
              form.status === "planned" ? "bg-blue-600 hover:bg-blue-700" :
              "bg-gray-700 hover:bg-gray-800"
            }`}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {showPreview && (
        <PostPreview form={form} categoryLabel={categoryLabel} onClose={() => setShowPreview(false)} />
      )}

      <ConfirmDialog
        open={confirmPublish}
        title={recipients ? `Publicar e enviar para ${recipients} pessoa${recipients !== 1 ? "s" : ""}?` : "Publicar e enviar o email?"}
        description="O post vai ao ar agora e o aviso por email sai em seguida. Isso não dá para desfazer."
        type="warning"
        confirmText="Publicar e enviar"
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => {
          setConfirmPublish(false);
          save();
        }}
      />

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Sair sem salvar?"
        description="As alterações deste post ainda não foram salvas."
        type="danger"
        confirmText="Sair sem salvar"
        cancelText="Continuar editando"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}
