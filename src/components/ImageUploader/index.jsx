import { useEffect, useState } from "react";

export default function ImageUploader({ onChange }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    onChange(selected);
  };

  const remove = () => {
    setFile(null);
    setPreview(null);
    onChange(null);
  };

  return (
    <div className="mt-4">
      {!preview && <input type="file" accept="image/*" onChange={handleFile} />}

      {preview && (
        <div className="relative mt-4">
          <img src={preview} className="w-full rounded-xl border" />
          <button
            type="button"
            onClick={remove}
            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
