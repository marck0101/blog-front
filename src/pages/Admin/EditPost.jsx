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
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar post");
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

      alert("Post atualizado com sucesso");
      navigate("/admin/posts");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold mb-6">Editar publicação</h1>

        {/* Título */}
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Slug */}
        <input
          className="input mt-2"
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
