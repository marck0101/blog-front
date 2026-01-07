export default function Select({ label, options = [], ...props }) {
  return (
    <div>
      <label>{label}</label>
      <select {...props}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
