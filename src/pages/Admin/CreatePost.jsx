import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const urlPlannedAt = searchParams.get("plannedAt") || "";

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "marketing",
    // Vindo do calendário: rascunho já com a data (só vira agendado quando pronto)
    status: "draft",
    plannedAt: urlPlannedAt || "",
    emailNotify: true,
    emailTeaser: "",
    emailSubject: "",
    emailPreheader: "",
    emailAudience: emptyAudience("post-category"),
    seo: { title: "", description: "" },
  });

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

  const handleSubmit = async () => {
    if (form.status === "planned" && !form.plannedAt) {
      showToast("Escolha a data de publicação do post agendado", "error");
      return;
    }
    try {
      setLoading(true);

      let finalCoverUrl = coverImage;

      if (coverFile) {
        finalCoverUrl = await UploadService.uploadCover(coverFile);
      }

      await PostsService.create({
        ...form,
        emailAudience: audienceToApi(form.emailAudience),
        published: form.status === "published",
        // Rascunho guarda a data do calendário; agendado, a data de publicação
        plannedAt: form.status === "published" ? null : form.plannedAt || null,
        gallery: gallery.filter(Boolean),
        coverImage: finalCoverUrl || "",
      });

      const msg =
        form.status === "published" ? "Post publicado com sucesso" :
        form.status === "planned" ? "Post agendado" : "Rascunho salvo";
      showToast(msg);
      setTimeout(() => navigate("/admin/posts"), 800);
    } catch (err) {
      showToast(err?.response?.data?.error || "Erro ao criar post", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="admin-content max-w-6xl mx-auto px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6">Criando post...</h1>
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
        <h1 className="text-2xl font-bold">Criar publicação</h1>

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
            placeholder="Slug (gerado automaticamente se vazio)"
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
          publishLabel="Publicar agora"
        />

        <PostEmailSection
          value={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          post={{
            _id: undefined,
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            category: form.category,
            coverUrl: coverImage,
            coverPreview,
          }}
          categories={categories}
        />

        {/* AÇÃO */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            form.status === "published" ? "bg-green-600 hover:bg-green-700" :
            form.status === "planned"   ? "bg-blue-600 hover:bg-blue-700" :
                                          "bg-gray-600 hover:bg-gray-700"
          } transition`}
        >
          {form.status === "published" ? "Publicar" :
           form.status === "planned"   ? "Agendar publicação" :
                                         "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
