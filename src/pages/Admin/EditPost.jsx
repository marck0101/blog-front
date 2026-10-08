import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import PostEmailSection from "../../components/PostEmailSection";
import PostStatusField from "../../components/PostStatusField";
import RichTextEditor from "../../components/RichTextEditor";
import ImageManager from "../../components/ImageManager";
import CoverImageUpload from "../../components/CoverImageUpload";
import FilterChips from "../../components/FilterChips";
import PostsService from "../../services/posts.service";
import UploadService from "../../services/upload.service";
import SubscriberService from "../../services/subscriber.service";
import PostSkeleton from "../../components/PostSkeleton";
import { audienceToApi, emptyAudience } from "../../utils/campaignAudience";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "marketing",
    status: "draft",
    plannedAt: "",
    emailNotify: true,
    emailTeaser: "",
    emailSubject: "",
    emailPreheader: "",
    emailAudience: emptyAudience("post-category"),
    seo: { title: "", description: "" },
  });
  // Já estava publicado ao abrir: o aviso automático não sai de novo
  const [wasPublished, setWasPublished] = useState(false);

  const [gallery, setGallery] = useState([]);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  // Capa para a prévia do email (arquivo ainda não enviado vira URL local)
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : coverImage),
    [coverFile, coverImage]
  );
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* LOAD POST */
  useEffect(() => {
    if (!id) return;

    PostsService.getById(id)
      .then((post) => {
        if (!post) throw new Error("Post não encontrado");
        const derivedStatus = post.status || (post.published ? "published" : "draft");
        const plannedAtVal = post.plannedAt
          ? new Date(post.plannedAt).toISOString().split("T")[0]
          : "";
        setForm({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          category: post.category || "marketing",
          status: derivedStatus,
          plannedAt: plannedAtVal,
          emailNotify: post.emailNotify !== false,
          emailTeaser: post.emailTeaser || "",
          emailSubject: post.emailSubject || "",
          emailPreheader: post.emailPreheader || "",
          emailAudience: {
            ...emptyAudience("post-category"),
            ...post.emailAudience,
            subscribers: post.emailAudience?.subscribers || [],
          },
          seo: {
            title: post.seo?.title || "",
            description: post.seo?.description || "",
          },
        });
        setWasPublished(derivedStatus === "published");
        setGallery(post.gallery || []);
        setCoverImage(post.coverImage || "");
      })
      .catch(() => {
        showToast("Erro ao carregar post", "error");
        navigate("/admin/posts");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /* SAVE */
  const handleSave = async () => {
    if (form.status === "planned" && !form.plannedAt) {
      showToast("Escolha a data de publicação do post agendado", "error");
      return;
    }
    try {
      setSaving(true);

      let finalCoverUrl = coverImage;

      if (coverFile) {
        finalCoverUrl = await UploadService.uploadCover(coverFile);
      }

      await PostsService.update(id, {
        ...form,
        emailAudience: audienceToApi(form.emailAudience),
        published: form.status === "published",
        // Rascunho guarda a data do calendário; agendado, a data de publicação
        plannedAt: form.status === "published" ? null : form.plannedAt || null,
        gallery,
        coverImage: finalCoverUrl || "",
      });

      const msg =
        form.status === "published" ? "Post atualizado e publicado" :
        form.status === "planned"   ? "Post agendado" : "Rascunho salvo";
      showToast(msg);
      setTimeout(() => navigate("/admin/posts"), 800);
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao salvar alterações", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-6 py-10 space-y-4">
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
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <main className="admin-content max-w-5xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Editar publicação</h1>

        {/* DADOS BÁSICOS */}
        <section className="space-y-2">
          <input
            className="input"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Categoria</p>
            <FilterChips
              options={categories}
              selected={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              multiSelect={false}
              showAll={false}
            />
          </div>
          <div className="relative">
            <textarea
              className="input"
              placeholder="Resumo do post (máx. 160 caracteres)..."
              value={form.excerpt}
              maxLength={160}
              rows={3}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setForm({ ...form, excerpt: e.target.value });
                }
              }}
            />
            <span
              className={`absolute bottom-2 right-3 text-xs ${
                form.excerpt.length === 160
                  ? "text-red-500"
                  : form.excerpt.length > 140
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            >
              {form.excerpt.length}/160
            </span>
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-lg border p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
          <h2 className="font-semibold text-sm uppercase text-gray-600 dark:text-gray-300">SEO</h2>
          <input
            className="input"
            placeholder="Título SEO (meta title)"
            value={form.seo.title}
            onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })}
          />
          <textarea
            className="input"
            placeholder="Descrição SEO (meta description)"
            value={form.seo.description}
            onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })}
          />
          <p className="text-xs text-gray-500">
            Caso vazio, o título e o resumo do post serão usados automaticamente.
          </p>
        </section>

        {/* IMAGEM DE CAPA */}
        <CoverImageUpload
          existingUrl={coverImage}
          onFileSelect={(file) => {
            setCoverFile(file);
            if (!file) setCoverImage("");
          }}
        />

        {/* GALERIA DE IMAGENS */}
        <ImageManager
          images={gallery}
          setImages={setGallery}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
        />

        {/* CONTEÚDO */}
        <RichTextEditor
          value={form.content}
          onChange={(content) => setForm({ ...form, content })}
        />

        {/* STATUS */}
        <PostStatusField
          status={form.status}
          plannedAt={form.plannedAt}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          publishLabel={wasPublished ? "Publicado" : "Publicar agora"}
          postId={id}
          alreadyPublished={wasPublished}
        />

        <PostEmailSection
          value={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          post={{
            _id: id,
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            category: form.category,
            coverUrl: coverImage,
            coverPreview,
          }}
          categories={categories}
          alreadyPublished={wasPublished}
        />

        {/* AÇÃO */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded text-white transition ${
            form.status === "published" ? "bg-green-600 hover:bg-green-700" :
            form.status === "planned"   ? "bg-blue-600 hover:bg-blue-700" :
                                          "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {saving ? "Salvando..." :
           form.status === "published" ? "Salvar e publicar" :
           form.status === "planned"   ? "Agendar publicação" :
                                         "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
