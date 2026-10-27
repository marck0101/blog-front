import { postFaq } from "../../seo/site";

/** Perguntas frequentes no fim do post — o mesmo conteúdo do schema FAQPage */
export default function PostFaq({ post }) {
  const items = postFaq(post);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="faq-title" className="mt-12">
      <h2 id="faq-title" className="text-2xl font-bold text-gray-900 dark:text-white">
        Perguntas frequentes
      </h2>
      <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
        {items.map((item, i) => (
          <details key={i} className="group py-4" open={i === 0}>
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-semibold text-gray-900 dark:text-gray-100">
              <h3 className="text-lg">{item.question}</h3>
              <span aria-hidden="true" className="mt-1 text-gray-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
