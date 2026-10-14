// Ação de publicar/despublicar. É um botão (com borda), não um selo de status:
// o status do post aparece no PostStatusBadge ao lado.
export default function PublishToggle({ post, disabled, onChange }) {
  const published = post?.published || post?.status === "published";
  const label = published ? "Despublicar" : post?.status === "planned" ? "Publicar agora" : "Publicar";

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={published ? "Volta para rascunho e sai do ar" : "Coloca no ar agora"}
      className={`px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap transition disabled:opacity-50
        ${published
          ? "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          : "border-green-600 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/30"
        }`}
    >
      {label}
    </button>
  );
}
