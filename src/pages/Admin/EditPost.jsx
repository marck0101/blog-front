import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
          seo: {
            title: post.seo?.title || "",
            description: post.seo?.description || "",
          },
        });
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
    try {
      setSaving(true);

      let finalCoverUrl = coverImage;

      if (coverFile) {
        finalCoverUrl = await UploadService.uploadCover(coverFile);
      }

      await PostsService.update(id, {
        ...form,
        published: form.status === "published",
        plannedAt: form.status === "planned" ? form.plannedAt || null : null,
        gallery,
        coverImage: finalCoverUrl || "",
      });

      const msg =
        form.status === "published" ? "Post atualizado e publicado" :
        form.status === "planned"   ? "Post planejado atualizado" : "Rascunho salvo";
      showToast(msg);
      setTimeout(() => navigate("/admin/posts"), 800);
    } catch {
      showToast("Erro ao salvar alterações", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
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
        <section className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "draft",     label: "Rascunho" },
              { value: "planned",   label: "Planejado" },
              { value: "published", label: "Publicado" },
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
              <label className="text-xs text-gray-500 dark:text-gray-300 block mb-1">Data planejada</label>
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
           form.status === "planned"   ? "Salvar como planejado" :
                                         "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
