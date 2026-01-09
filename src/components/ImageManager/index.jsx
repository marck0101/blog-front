import { uploadImage } from "../../services/uploadImage";
import { generateUUID } from "../../utils/uuid";
import { useState } from "react";
import ImageDropzone from "../ImageDropzone";

export default function ImageManager({
  images,
  setImages,
  coverImage,
  setCoverImage,
}) {
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("Formato inválido. Use JPG, PNG ou WEBP.", "error");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("Imagem muito grande. Máx: 5MB.", "error");
      return false;
    }

    return true;
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleUpload = async (file) => {
    if (!file) return;

    if (!validateFile(file)) return;

    try {
      setUploading(true);

      const url = await uploadImage(file);

      setImages((prev) => [...prev, { url, id: generateUUID() }]);

      if (!coverImage) setCoverImage(url);

      showToast("Imagem enviada com sucesso");
    } catch (err) {
      console.error(err);
      showToast("Erro ao enviar imagem", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);

      // Se removeu a imagem de capa
      if (coverImage && !updated.find((img) => img.url === coverImage)) {
        setCoverImage(updated[0]?.url || null);
      }

      return updated;
    });
  };

  const copyMarkdown = async (url) => {
    const markdown = `![Imagem](${url})`;

    // Clipboard API moderna (HTTPS / localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(markdown);
        showToast("Markdown copiado");
        return;
      } catch (err) {
        console.warn("Clipboard API falhou, usando fallback", err);
      }
    }

    // Fallback (HTTP, mobile, IP local)
    try {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      document.execCommand("copy");
      document.body.removeChild(textarea);

      showToast("Markdown copiado");
    } catch (err) {
      console.error(err);
      showToast("Erro ao copiar markdown", "error");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Imagens do post</h2>

      {/* Upload */}
      <div className="inline-flex items-center gap-2">
        <ImageDropzone
          disabled={uploading}
          onSelect={(file) => handleUpload(file)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative border rounded-lg overflow-hidden bg-white dark:bg-gray-900"
          >
            {/* Remover */}
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>

            <img src={img.url} alt="" className="w-full h-40 object-cover" />

            <div className="p-2 text-xs flex flex-col gap-1">
              <button
                onClick={() => copyMarkdown(img.url)}
                className="text-blue-600 hover:underline text-left"
              >
                Copiar Markdown
              </button>

              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={coverImage === img.url}
                  onChange={() => setCoverImage(img.url)}
                />
                {coverImage === img.url
                  ? "Capa (selecionada)"
                  : "Definir como capa"}
              </label>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
