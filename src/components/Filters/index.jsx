export default function Filters({ category, onChange }) {
  return (
    <div className="mt-4 mb-6 w-full">
      <label
        htmlFor="category"
        className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Filtrar por categoria
      </label>

      <select
        id="category"
        value={category}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-lg
          border
          border-gray-300
          bg-white
          px-4
          py-3
          text-gray-900
          shadow-sm
          focus:border-blue-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          dark:border-gray-700
          dark:bg-gray-900
          dark:text-gray-100
          dark:focus:border-blue-400
          dark:focus:ring-blue-400
        "
      >
        <option value="">Todas as categorias</option>
        <option value="marketing">Marketing</option>
        <option value="trafego">Tráfego</option>
        <option value="growth">Growth</option>
        <option value="tecnologia">Tecnologia</option>
      </select>
    </div>
  );
}
