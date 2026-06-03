import { Helmet } from "react-helmet-async";

const SITE_NAME = "marck0101";
const SITE_URL = "https://blog.marck0101.com.br";
const DEFAULT_TITLE = "marck0101 — Blog";
const DEFAULT_DESCRIPTION =
  "Blog sobre marketing digital, tráfego pago e growth. Artigos práticos para quem quer crescer online.";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  publishedAt,
  author = "Marcos Henrique",
  robots,
}) {
  const metaTitle = title || DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const metaUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const metaRobots = robots || "index, follow";

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />
      <meta name="robots" content={metaRobots} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
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
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
    </Helmet>
  );
}
