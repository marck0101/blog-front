export default function Textarea({ label, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <textarea {...props} />
    </div>
  )
}
