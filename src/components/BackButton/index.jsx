import { Link } from 'react-router-dom'

export default function BackButton() {
  return (
    <Link
      to="/blog"
      className="inline-block mb-6 text-sm text-blue-600 hover:underline"
    >
      ← Voltar para o blog
    </Link>
  )
}
