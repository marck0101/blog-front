import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import MarkdownEditor from "../../components/MarkdownEditor";
import ImageManager from "../../components/ImageManager";
import PostsService from "../../services/posts.service";
import PostSkeleton from "../../components/PostSkeleton";

const CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "trafego", label: "Tráfego Pago" },
  { value: "growth", label: "Growth" },
  { value: "tecnologia", label: "Tecnologia" },
];

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "marketing",
    published: false, // 🔴 sincronizado com backend
    seo: {
      title: "",
      description: "",
    },
  });

  const [gallery, setGallery] = useState([]);
  const [coverImage, setCoverImage] = useState("");

  /* ---------------- LOAD POST ---------------- */
  useEffect(() => {
    if (!id) return;

    const loadPost = async () => {
      try {
        const { data: post } = await PostsService.getById(id);

        setForm({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          category: post.category || "marketing",
          published: Boolean(post.published),
          seo: {
            title: post.seo?.title || "",
            description: post.seo?.description || "",
          },
        });

        setGallery(post.gallery || []);
        setCoverImage(post.coverImage || "");
      } catch {
        showToast("Erro ao carregar post", "error");
        navigate("/admin/posts");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, navigate]);

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    try {
      setSaving(true);

      await PostsService.update(id, {
        ...form,
        gallery,
        coverImage,
      });

      showToast(
        form.published
          ? "Post atualizado e publicado"
          : "Post salvo como rascunho"
      );

      setTimeout(() => navigate("/admin/posts"), 800);
    } catch {
      showToast("Erro ao salvar alterações", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6">Posts</h1>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </main>
      </>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <Header />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Editar publicação</h1>

        {/* Título */}
        <input
          className="input"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Slug */}
        <input
          className="input mt-2"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

        {/* Categoria */}
        <select
          className="input mt-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Resumo */}
        <textarea
          className="input mt-2"
          placeholder="Resumo"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />

        {/* Imagens */}
        <ImageManager
          images={gallery}
          setImages={setGallery}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
        />

        {/* Conteúdo */}
        <MarkdownEditor
          value={form.content}
          onChange={(content) => setForm({ ...form, content })}
        />

        {/* STATUS DE PUBLICAÇÃO */}
        <div className="mt-4 flex items-start gap-3">
          <input
            id="published"
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="mt-1"
          />
          <label htmlFor="published" className="text-sm">
            <strong>Publicado</strong>
            <p className="text-xs text-gray-500">
              Se desmarcado, o post permanece como rascunho.
            </p>
          </label>
        </div>

        {/* Ação */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`mt-6 px-4 py-2 rounded text-white ${
            form.published ? "bg-green-600" : "bg-blue-600"
          }`}
        >
          {saving
            ? "Salvando..."
            : form.published
            ? "Salvar e publicar"
            : "Salvar rascunho"}
        </button>
      </main>
    </>
  );
}
