import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import { AboutSchema } from "../../components/StructuredData";
import { ABOUT_DESCRIPTION, ABOUT_HTML, ABOUT_TITLE } from "../../seo/about";
import authorPhoto from "../../assets/author-256.webp?no-inline";
import authorPhotoLarge from "../../assets/author.webp";
import { AUTHOR_NAME } from "../../seo/site";

// /sobre — quem escreve o blog e onde atua (o mesmo texto do prerender)
export default function About() {
  return (
    <BlogLayout>
      <SEO title={ABOUT_TITLE} description={ABOUT_DESCRIPTION} url="/sobre" />
      <AboutSchema />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="flex items-center gap-5 mb-10">
          <img
            src={authorPhoto}
            srcSet={`${authorPhoto} 256w, ${authorPhotoLarge} 400w`}
            sizes="96px"
            alt={AUTHOR_NAME}
            width={96}
            height={96}
            className="shrink-0 w-24 h-24 rounded-full object-cover object-top shadow"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sobre o autor</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{ABOUT_DESCRIPTION}</p>
          </div>
        </header>

        {/* Texto estático do próprio site (src/seo/about.js), o mesmo do prerender */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none space-y-8"
          dangerouslySetInnerHTML={{ __html: ABOUT_HTML }}
        />
      </main>
    </BlogLayout>
  );
}
