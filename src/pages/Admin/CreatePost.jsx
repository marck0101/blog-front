import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function CreatePost() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await PostsService.create({
        ...form,
        gallery,
        coverImage,
      });

      showToast("Post criado com sucesso");
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
        <h1 className="text-2xl font-bold mb-6">Criar publicação</h1>

        <input
          className="input"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="input mt-2"
          placeholder="Slug"
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
          placeholder="Resumo"
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
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Salvando..." : "Publicar"}
        </button>
      </main>
    </>
  );
}
