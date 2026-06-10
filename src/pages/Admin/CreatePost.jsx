import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import RichTextEditor from "../../components/RichTextEditor";
import ImageManager from "../../components/ImageManager";
import CoverImageUpload from "../../components/CoverImageUpload";
import FilterChips from "../../components/FilterChips";
import PostsService from "../../services/posts.service";
import UploadService from "../../services/upload.service";
import SubscriberService from "../../services/subscriber.service";
import PostSkeleton from "../../components/PostSkeleton";

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
    status: urlPlannedAt ? "planned" : "draft",
    plannedAt: urlPlannedAt || "",
    seo: { title: "", description: "" },
  });

  const [gallery, setGallery] = useState([]);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    SubscriberService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let finalCoverUrl = coverImage;

      if (coverFile) {
        finalCoverUrl = await UploadService.uploadCover(coverFile);
      }

      await PostsService.create({
        ...form,
        published: form.status === "published",
        plannedAt: form.status === "planned" ? form.plannedAt || null : null,
        gallery: gallery.filter(Boolean),
        coverImage: finalCoverUrl || "",
      });

      const msg =
        form.status === "published" ? "Post publicado com sucesso" :
        form.status === "planned" ? "Post planejado salvo" : "Rascunho salvo";
      showToast(msg);
      setTimeout(() => navigate("/admin/posts"), 800);
    } catch {
      showToast("Erro ao criar post", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
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
        <section className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "draft",     label: "Rascunho" },
              { value: "planned",   label: "Planejado" },
              { value: "published", label: "Publicar agora" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={form.status === value}
                  onChange={() => setForm({ ...form, status: value })}
                  className="accent-blue-600"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {form.status === "planned" && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-300 block mb-1">
                Data planejada
              </label>
              <input
                type="date"
                value={form.plannedAt}
                onChange={(e) => setForm({ ...form, plannedAt: e.target.value })}
                className="input w-48"
              />
            </div>
          )}
        </section>

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
           form.status === "planned"   ? "Salvar como planejado" :
                                         "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
