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
    published: false,
    seo: {
      title: "",
      description: "",
    },
  });

  const [gallery, setGallery] = useState([]);
  const [coverImage, setCoverImage] = useState("");

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

  const handleSave = async () => {
    try {
      setSaving(true);

      await PostsService.update(id, {
        ...form,
        gallery,
        coverImage,
      });

      showToast("Post atualizado com sucesso");
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
          <h1 className="text-2xl font-bold mb-6">Posts</h1>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </main>
      </>
    );
  }

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

        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="input mt-2"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

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

        <textarea
          className="input mt-2"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />

        <ImageManager
          images={gallery}
          setImages={setGallery}
          coverImage={coverImage}
          setCoverImage={setCoverImage}
        />

        <MarkdownEditor
          value={form.content}
          onChange={(content) => setForm({ ...form, content })}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </main>
    </>
  );
}
