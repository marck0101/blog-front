import { Helmet } from "react-helmet-async";

const SITE_URL = "https://blog.marck0101.com.br";
const AUTHOR = { "@type": "Person", "name": "Marcos Henrique" };
const PUBLISHER = {
  "@type": "Organization",
  "name": "marck0101",
  "url": SITE_URL,
};

export function BlogSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "marck0101",
    url: SITE_URL,
    description: "Blog sobre marketing digital, tráfego pago e growth.",
    author: AUTHOR,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function BlogPostSchema({ post }) {
  if (!post) return null;

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: postUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: post.title,
          item: postUrl,
        },
      ],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
