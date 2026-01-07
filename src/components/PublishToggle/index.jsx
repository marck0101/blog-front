export default function PublishToggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`px-3 py-1 rounded text-sm font-medium
        ${checked
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
        }`}
    >
      {checked ? 'Publicado' : 'Rascunho'}
    </button>
  )
}
