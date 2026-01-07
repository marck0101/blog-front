import { useEffect } from 'react'

export default function useSEO({
  title,
  description,
  image
}) {
  useEffect(() => {
    if (title) {
      document.title = title
    }

    if (description) {
      setMetaTag('description', description)
    }

    if (image) {
      setPropertyTag('og:image', image)
    }
  }, [title, description, image])
}

function setMetaTag(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function setPropertyTag(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}
