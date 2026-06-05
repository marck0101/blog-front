import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { normalizeImageUrl } from "../../utils/imageUrl";

export default function CoverImageUpload({ existingUrl, onFileSelect }) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const current = preview || normalizeImageUrl(existingUrl) || null;

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Imagem de capa
      </label>

      {current ? (
        <div className="relative w-full max-w-md">
          <img
            src={current}
            alt="Capa"
            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded"
          >
            Trocar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed
            border-gray-400 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
            hover:border-blue-500 hover:text-blue-500 transition"
        >
          <ImagePlus size={16} />
          Selecionar imagem de capa
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500">JPG, PNG ou WEBP • máx 2MB</p>
    </div>
  );
}
