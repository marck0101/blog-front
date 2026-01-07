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

      alert("Post criado com sucesso");
      navigate("/admin/posts");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10 space-y-4">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Posts
          </h1>

          {Array.from({ length: 5 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10 text-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">Criar publicação</h1>

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

        {/* SEO */}
        <h2 className="text-lg font-semibold mt-8 dark:text-gray-200">SEO</h2>

        <input
          className="input mt-2"
          placeholder="Título SEO"
          value={form.seo.title}
          onChange={(e) =>
            setForm({
              ...form,
              seo: { ...form.seo, title: e.target.value },
            })
          }
        />

        <textarea
          className="input mt-2"
          placeholder="Descrição SEO"
          value={form.seo.description}
          onChange={(e) =>
            setForm({
              ...form,
              seo: { ...form.seo, description: e.target.value },
            })
          }
        />

        {/* Publicação */}
        <label className="flex gap-2 mt-4">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Publicar agora
        </label>

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
