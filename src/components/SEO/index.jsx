import { Helmet } from "react-helmet-async";
import {
  SITE_URL,
  SITE_NAME,
  AUTHOR_NAME,
  HOME_TITLE,
  HOME_DESCRIPTION,
  DEFAULT_IMAGE,
} from "../../seo/site";

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  publishedAt,
  modifiedAt,
  robots,
}) {
  const metaTitle = title || HOME_TITLE;
  const metaDescription = description || HOME_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const metaUrl = url ? `${SITE_URL}${url}` : `${SITE_URL}/blog`;
  const metaRobots = robots || "index, follow, max-image-preview:large";

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />
      <meta name="robots" content={metaRobots} />
      <meta name="author" content={AUTHOR_NAME} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Article-specific */}
      {type === "article" && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === "article" && modifiedAt && (
        <meta property="article:modified_time" content={modifiedAt} />
      )}
      {type === "article" && (
        <meta property="article:author" content={AUTHOR_NAME} />
      )}
    </Helmet>
  );
}
