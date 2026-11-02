import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MailX, CheckCircle2, AlertTriangle } from "lucide-react";
import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";
import SubscriberService from "../../services/subscriber.service";

// Token e envio chegam depois do # (a API redireciona o link do email para cá):
// essa parte nunca vai a servidor nenhum. Lidos uma vez ao abrir.
function readLink() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("t") || "";
  return { token: /^[a-f0-9]{64}$/.test(token) ? token : "", campaign: params.get("c") || "" };
}

/**
 * /cancelar-inscricao — confirmação antes de cancelar. O link do email não
 * cancela sozinho: antivírus de email abrem todos os links ao receber.
 * Fora do GA4/Clarity/Pixel (utils/analytics → PRIVATE_PATHS).
 */
export default function Unsubscribe() {
  const [link] = useState(readLink);
  // confirm | sending | done | error | missing
  const [state, setState] = useState(link.token ? "confirm" : "missing");
  const [error, setError] = useState("");

  // Tira o token da barra de endereço (histórico, print, compartilhar a aba)
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const confirm = async () => {
    setState("sending");
    try {
      await SubscriberService.unsubscribe(link.token, link.campaign);
      setState("done");
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "Este link de cancelamento não é válido. Use o link do rodapé de um email recente."
          : "Não foi possível cancelar agora. Tente de novo em alguns minutos."
      );
      setState("error");
    }
  };

  return (
    <BlogLayout>
      <SEO title="Cancelar inscrição" robots="noindex, nofollow" url="/cancelar-inscricao" />

      <main className="max-w-xl mx-auto px-6 py-16">
        {(state === "confirm" || state === "sending") && (
          <section aria-labelledby="unsub-title" className="text-center">
            <MailX size={40} className="mx-auto text-gray-400" aria-hidden="true" />
            <h1 id="unsub-title" className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Cancelar inscrição?
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Você deixa de receber os emails do blog: avisos de posts novos e envios exclusivos.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={confirm}
                disabled={state === "sending"}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {state === "sending" ? "Cancelando..." : "Sim, cancelar inscrição"}
              </button>
              <Link
                to="/blog"
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Continuar recebendo
              </Link>
            </div>
          </section>
        )}

        {state === "done" && (
          <section role="status" className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-600" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Inscrição cancelada</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Você não vai receber mais emails do blog. Mudou de ideia? É só se inscrever de novo no blog.
            </p>
            <Link to="/blog" className="inline-block mt-8 text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Voltar ao blog
            </Link>
          </section>
        )}

        {(state === "error" || state === "missing") && (
          <section role="alert" className="text-center">
            <AlertTriangle size={40} className="mx-auto text-amber-500" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {state === "missing" ? "Link incompleto" : "Não deu certo"}
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              {state === "missing"
                ? "Abra o link “Cancelar inscrição” que está no rodapé do email."
                : error}
            </p>
            {state === "error" && link.token && (
              <button type="button" onClick={confirm} className="mt-8 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Tentar de novo
              </button>
            )}
          </section>
        )}
      </main>
    </BlogLayout>
  );
}
