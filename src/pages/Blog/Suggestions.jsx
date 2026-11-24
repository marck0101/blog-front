import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Lightbulb, MessagesSquare, PenLine, Sparkles } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import SubscriberService from "../../services/subscriber.service";
import SuggestionsService from "../../services/suggestions.service";
import { useFeatures } from "../../utils/features";
import { errorText } from "../../utils/apiError";
import { setPageContext, trackEvent } from "../../utils/analytics";

// Mesmos valores do backend (app/models/suggestion.model.js)
const KINDS = [
  { value: "topic", label: "Fale sobre um tema", hint: "Um assunto que você quer ver explicado aqui", icon: PenLine },
  { value: "participate", label: "Quero participar", hint: "Entrevista, case, escrever junto", icon: MessagesSquare },
  { value: "other", label: "Outra ideia", hint: "Formato, série, ferramenta para testar", icon: Sparkles },
];

const PLACEHOLDER = {
  topic: "Ex.: como saber se o pixel está contando as conversões certas",
  participate: "Conte quem você é e o que poderia mostrar (um case, um erro que cometeu, um número)",
  other: "Conte a ideia",
};

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1500;

// ?de=/blog/slug: página de onde a pessoa veio (só caminhos do próprio blog)
const safePath = (value) => (typeof value === "string" && /^\/[\w\-/]*$/.test(value) ? value.slice(0, 200) : "");

function Showcase({ items, categories }) {
  if (items.length === 0) return null;
  const label = (slug) => categories.find((c) => c.slug === slug)?.label || slug;
  return (
    <section aria-labelledby="atendidas" className="mt-14">
      <h2 id="atendidas" className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vocês pediram, saiu</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Sugestões de leitores que viraram post.</p>
      <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((s) => (
          <li key={s._id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label(s.category)}</p>
            <p className="mt-1 text-gray-900 dark:text-gray-100">“{s.text}”</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{s.by ? `Sugestão de ${s.by}` : "Sugestão de um leitor"}</p>
            <Link
              to={`/blog/${s.post.slug}`}
              onClick={() => trackEvent("suggestion_showcase_click", { post_slug: s.post.slug })}
              className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ler: {s.post.title} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// /sugestoes — caixinha de sugestões dos leitores. Tudo chega privado ao painel
// (Sugestões); só aparece aqui o que virou post e o autor escolheu mostrar.
export default function Suggestions() {
  const { suggestions: open } = useFeatures();
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [showcase, setShowcase] = useState([]);
  const [form, setForm] = useState({
    kind: "topic",
    category: params.get("assunto") || "",
    message: "",
    name: "",
    email: "",
    allowName: false,
    subscribe: false,
    website: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null); // { subscribed }
  const started = useRef(false);

  useEffect(() => {
    setPageContext({ page_type: "suggestions" });
    SubscriberService.getCategories().then(setCategories).catch(() => {});
    SuggestionsService.listPublic().then(setShowcase).catch(() => {});
  }, []);

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const onStart = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("suggestion_form_start");
  };

  const messageLength = form.message.trim().length;
  const ready = form.category && messageLength >= MESSAGE_MIN && form.email.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError("");
    try {
      await SuggestionsService.send({
        ...form,
        name: form.name.trim() || undefined,
        email: form.email.trim(),
        message: form.message.trim(),
        sourcePath: safePath(params.get("de")) || "/sugestoes",
      });
      trackEvent("suggestion_submit", { suggestion_kind: form.kind, post_category: form.category, subscribed: form.subscribe });
      if (form.subscribe) {
        trackEvent(
          "generate_lead",
          { lead_source: "suggestion", form_location: "suggestions", post_category: form.category },
          { pixel: "Lead", pixelParams: { content_name: "suggestion" } }
        );
      }
      setSent({ subscribed: form.subscribe });
    } catch (err) {
      setError(errorText(err) || "Não consegui enviar agora. Tente de novo em alguns minutos.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setForm((f) => ({ ...f, message: "", kind: "topic" }));
    setSent(null);
  };

  return (
    <BlogLayout>
      <SEO
        title="Sugira um tema"
        description="Mande um tema que você quer ver no blog ou peça para participar de um conteúdo. Eu leio todas as sugestões."
        url="/sugestoes"
      />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          <Link to="/blog" className="hover:underline dark:hover:text-gray-100">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-100 font-medium">Sugestões</span>
        </nav>

        <header>
          <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            <Lightbulb size={28} className="text-blue-600 dark:text-blue-400" aria-hidden="true" /> Sugira um tema
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Tem um assunto que quer ver explicado aqui, ou quer participar de um conteúdo? Eu leio todas. A sugestão
            fica só comigo; se ela virar post, eu te aviso por email.
          </p>
        </header>

        {!open ? (
          <p className="mt-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-gray-600 dark:text-gray-300">
            A caixinha está fechada no momento. Volte em breve.
          </p>
        ) : sent ? (
          <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center" role="status">
            <CheckCircle2 size={32} className="mx-auto text-green-600" aria-hidden="true" />
            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Sugestão recebida. Obrigado!</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {sent.subscribed
                ? "Você também vai receber os próximos artigos por email. Dá para cancelar em qualquer email."
                : "Se ela virar post, te mando o link."}
            </p>
            <button type="button" onClick={reset} className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Mandar outra sugestão
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} onFocus={onStart} className="mt-8 space-y-6" noValidate>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">O que você quer sugerir?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {KINDS.map(({ value, label, hint, icon: Icon }) => {
                  const checked = form.kind === value;
                  return (
                    <label
                      key={value}
                      className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition ${
                        checked
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500"
                          : "border-gray-300 dark:border-gray-700 hover:border-blue-400"
                      }`}
                    >
                      <input type="radio" name="kind" value={value} checked={checked} onChange={set("kind")} className="sr-only" />
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <Icon size={16} aria-hidden="true" /> {label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="sug-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assunto <span className="text-red-500" aria-hidden>*</span>
              </label>
              <select id="sug-category" name="category" required value={form.category} onChange={set("category")} className="input">
                <option value="">Escolha o assunto</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sug-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sua sugestão <span className="text-red-500" aria-hidden>*</span>
              </label>
              <textarea
                id="sug-message"
                name="message"
                required
                rows={5}
                maxLength={MESSAGE_MAX}
                placeholder={PLACEHOLDER[form.kind]}
                value={form.message}
                onChange={set("message")}
                aria-describedby="sug-message-count"
                className="input"
              />
              <p id="sug-message-count" className="mt-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {messageLength < MESSAGE_MIN
                  ? `Pelo menos ${MESSAGE_MIN} caracteres`
                  : `${form.message.length}/${MESSAGE_MAX}`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sug-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seu nome (opcional)
                </label>
                <input id="sug-name" name="name" autoComplete="name" maxLength={100} value={form.name} onChange={set("name")} className="input" />
              </div>
              <div>
                <label htmlFor="sug-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seu email <span className="text-red-500" aria-hidden>*</span>
                </label>
                <input
                  id="sug-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  aria-describedby="sug-email-hint"
                  className="input"
                />
                <p id="sug-email-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">Só para eu te responder. Não aparece no blog.</p>
              </div>
            </div>

            {/* Armadilha para robôs: gente não vê nem preenche */}
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
              <label>
                Site
                <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 p-3 cursor-pointer">
                <input type="checkbox" name="subscribe" checked={form.subscribe} onChange={set("subscribe")} className="mt-1 h-4 w-4" />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  <strong>Também quero receber os próximos artigos por email.</strong>{" "}
                  <span className="text-gray-600 dark:text-gray-300">Todos os temas. Cancele quando quiser.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 px-3 cursor-pointer">
                <input type="checkbox" name="allowName" checked={form.allowName} onChange={set("allowName")} className="mt-1 h-4 w-4" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Se a sugestão virar post, pode mostrar meu primeiro nome em “Vocês pediram, saiu”.
                </span>
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!ready || sending}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sending ? "Enviando..." : "Enviar sugestão"}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Veja como uso seus dados na <Link to="/privacidade" className="underline">política de privacidade</Link>.
              </p>
            </div>
          </form>
        )}

        <Showcase items={showcase} categories={categories} />
      </main>
    </BlogLayout>
  );
}
