import { useRef, useState } from "react";

export default function ImageDropzone({ onSelect, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files?.length) return;
    onSelect(files[0]);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`
        mt-4 cursor-pointer rounded-lg border-2 border-dashed
        px-6 py-8 text-center transition
        ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-700"
        }
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-50 dark:hover:bg-gray-900"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          handleFiles(e.target.files);
          e.target.value = ""; // reset para permitir reupload do mesmo arquivo
        }}
      />

      <p className="text-sm text-gray-700 dark:text-gray-300">
        Arraste uma imagem aqui ou{" "}
        <span className="text-blue-600 font-medium">
          clique para selecionar
        </span>
      </p>

      <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP • até 5MB</p>
    </div>
  );
}
