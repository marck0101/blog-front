import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import {
  PRIVACY_DESCRIPTION,
  PRIVACY_HTML,
  PRIVACY_TITLE,
  PRIVACY_UPDATED,
} from "../../seo/privacy";

export default function PrivacyPolicy() {
  return (
    <BlogLayout>
      <SEO
        title={PRIVACY_TITLE}
        description={PRIVACY_DESCRIPTION}
        url="/privacidade"
        robots="noindex"
      />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-10">
          Última atualização: {PRIVACY_UPDATED}
        </p>

        {/* Texto estático do próprio site (src/seo/privacy.js), o mesmo do prerender */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none space-y-8"
          dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }}
        />
      </main>
    </BlogLayout>
  );
}
