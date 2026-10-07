import { Helmet } from "react-helmet-async";
import { blogHomeSchema, postSchema } from "../../seo/site";

function JsonLd({ data }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

export function BlogSchema({ posts = [] }) {
  return <JsonLd data={blogHomeSchema(posts)} />;
}

export function BlogPostSchema({ post }) {
  if (!post) return null;
  return <JsonLd data={postSchema(post)} />;
}
