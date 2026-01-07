import { Link } from 'react-router-dom'

export default function Breadcrumb({ title }) {
  return (
    <nav className="text-sm text-gray-500 mb-6">
      <Link to="/blog" className="hover:underline">
        Blog
      </Link>
      <span className="mx-2">/</span>
      <span className="text-gray-700 font-medium">
        {title}
      </span>
    </nav>
  )
}
