import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import MarkdownEditor from "../../components/MarkdownEditor";
import ImageManager from "../../components/ImageManager";
import CoverImageUpload from "../../components/CoverImageUpload";
import FilterChips from "../../components/FilterChips";
import PostsService from "../../services/posts.service";
import UploadService from "../../services/upload.service";
import SubscriberService from "../../services/subscriber.service";
import PostSkeleton from "../../components/PostSkeleton";

export default function CreatePost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "marketing",
    published: false,
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
        gallery: gallery.filter(Boolean),
        coverImage: finalCoverUrl || "",
      });

      showToast(form.published ? "Post publicado com sucesso" : "Post salvo como rascunho");
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Categoria</p>
            <FilterChips
              options={categories}
              selected={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              multiSelect={false}
              showAll={false}
            />
          </div>
          <textarea
            className="input"
            placeholder="Resumo (excerpt)"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
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
        <MarkdownEditor
          value={form.content}
          onChange={(content) => setForm({ ...form, content })}
        />

        {/* STATUS */}
        <div className="flex items-start gap-3">
          <input
            id="published"
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="mt-1"
          />
          <label htmlFor="published" className="text-sm">
            <strong>Publicar agora</strong>
            <p className="text-xs text-gray-500">Se desmarcado, o post será salvo como rascunho.</p>
          </label>
        </div>

        {/* AÇÃO */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${form.published ? "bg-green-600" : "bg-blue-600"}`}
        >
          {form.published ? "Publicar" : "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
