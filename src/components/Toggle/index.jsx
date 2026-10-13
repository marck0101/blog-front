export default function Toggle({ label, checked, onChange }) {
  return (
    <label>
      <input name="toggle"
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
