import { uploadImage } from "../../services/uploadImage";

export default function ImageManager({
  images,
  setImages,
  coverImage,
  setCoverImage,
}) {
  const handleUpload = async (file) => {
    const url = await uploadImage(file);

    setImages((prev) => [
      ...prev,
      { url, id: crypto.randomUUID() },
    ]);

    if (!coverImage) setCoverImage(url);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const copyMarkdown = (url) => {
    navigator.clipboard.writeText(`![Imagem](${url})`);
    alert("Markdown copiado!");
  };

  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Imagens do post</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleUpload(e.target.files[0])}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative border rounded overflow-hidden"
          >
            {/* BOTÃO REMOVER */}
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>

            <img
              src={img.url}
              alt=""
              className="w-full h-40 object-cover"
            />

            <div className="p-2 text-xs flex flex-col gap-1">
              <button
                onClick={() => copyMarkdown(img.url)}
                className="text-blue-600"
              >
                Copiar Markdown
              </button>

              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={coverImage === img.url}
                  onChange={() => setCoverImage(img.url)}
                />
                Capa
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
