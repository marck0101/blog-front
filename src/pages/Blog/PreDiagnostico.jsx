import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Check, ShieldCheck } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import PostFaq from "../../components/PostFaq";
import {
  PRE_CHECKS,
  PRE_DESCRIPTION,
  PRE_EMAIL_URL,
  PRE_FAQ,
  PRE_H1,
  PRE_NOT,
  PRE_NOT_NOTE,
  PRE_PATH,
  PRE_STEPS,
  PRE_TITLE,
  PRE_WHATSAPP_URL,
  preDiagnosticoSchema,
} from "../../seo/preDiagnostico";
import { trackPreDiagnosticoCta } from "../../utils/preDiagnostico";

const H2 = "text-2xl font-bold text-gray-900 dark:text-gray-100";

function CtaButtons({ location }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <a
        href={PRE_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPreDiagnosticoCta("whatsapp", location)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 transition"
      >
        <MessageCircle size={20} aria-hidden="true" />
        Pedir pelo WhatsApp
      </a>
      <a
        href={PRE_EMAIL_URL}
        onClick={() => trackPreDiagnosticoCta("email", location)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold px-5 py-3 transition"
      >
        <Mail size={20} aria-hidden="true" />
        Pedir por e-mail
      </a>
    </div>
  );
}

// /pre-diagnostico — landing do pré-diagnóstico gratuito (o mesmo texto do prerender)
export default function PreDiagnostico() {
  return (
    <BlogLayout>
      <SEO title={PRE_TITLE} description={PRE_DESCRIPTION} url={PRE_PATH} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(preDiagnosticoSchema())}</script>
      </Helmet>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Pré-diagnóstico gratuito
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{PRE_H1}</h1>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Eu olho seu site, sua ficha no Google e seu rastreamento, comparo com quem disputa o mesmo cliente na sua
            cidade e te mando um relatório curto com o que está travando.
          </p>
          <div className="mt-6">
            <CtaButtons location="hero" />
          </div>
        </header>

        <section className="mt-14" aria-labelledby="pre-check">
          <h2 id="pre-check" className={H2}>O que eu verifico</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {PRE_CHECKS.map((item) => (
              <li
                key={item.title}
                className="skin-card rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="pre-how">
          <h2 id="pre-how" className={H2}>Como funciona</h2>
          <ol className="mt-4 space-y-3">
            {PRE_STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span
                  aria-hidden="true"
                  className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="pre-not">
          <h2 id="pre-not" className={H2}>O que isto não é</h2>
          <ul className="mt-4 space-y-2">
            {PRE_NOT.map((item) => (
              <li key={item} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Check size={18} className="text-green-600 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-2 text-gray-700 dark:text-gray-300">
            <ShieldCheck size={18} className="mt-1 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            {PRE_NOT_NOTE}
          </p>
        </section>

        <section className="mt-14 skin-card rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6">
          <h2 className={H2}>Peça o seu</h2>
          <p className="mt-2 mb-4 text-gray-700 dark:text-gray-300">
            Me mande o endereço do site e a cidade onde você atende. O texto já vem pronto no WhatsApp.
          </p>
          <CtaButtons location="bottom" />
        </section>

        <PostFaq items={PRE_FAQ} className="mt-14" />

        <p className="mt-10 text-sm text-gray-500 dark:text-gray-300">
          Quer saber quem sou antes? <Link to="/sobre" className="underline">Sobre o autor</Link>.
        </p>
      </main>
    </BlogLayout>
  );
}
