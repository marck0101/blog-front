export default function Filters({ category, onChange }) {
  return (
    <select
      value={category}
      onChange={(e) => onChange(e.target.value)}
      className="border px-3 py-2 rounded"
    >
      <option value="">Todas as categorias</option>
      <option value="marketing">Marketing</option>
      <option value="trafego">Trafego</option>
      <option value="growth">Growth</option>
      <option value="tecnologia">Tecnologia</option>
    </select>
  );
}
