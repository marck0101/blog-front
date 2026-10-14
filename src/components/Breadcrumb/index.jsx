import { Link } from 'react-router-dom'

const linkClass = "hover:underline dark:hover:text-gray-100"

// trail: níveis intermediários [{ label, to }] entre "Blog" e o título
export default function Breadcrumb({ title, trail = [] }) {
  return (
    <nav aria-label="Você está em" className="text-sm text-gray-500 dark:text-gray-300 mb-6">
      <Link to="/blog" className={linkClass}>
        Blog
      </Link>
      {trail.map((item) => (
        <span key={item.to}>
          <span className="mx-2">/</span>
          <Link to={item.to} className={linkClass}>
            {item.label}
          </Link>
        </span>
      ))}
      <span className="mx-2">/</span>
      <span className="text-gray-700 dark:text-gray-100 font-medium">
        {title}
      </span>
    </nav>
  )
}
