import { useEffect, useState } from "react";
import { answerOffer, TERMINAL_CATEGORY, useOfferAnswer, useSkin } from "../utils/skin";
import { CONSENT_EVENT, trackEvent } from "../utils/analytics";
import { useFeatures } from "../utils/features";

// O banner de cookies ocupa o mesmo lugar: o convite espera ele sair
function useConsentAnswered() {
  const read = () => {
    try {
      return Boolean(localStorage.getItem("cookiesAccepted"));
    } catch {
      return true;
    }
  };
  const [answered, setAnswered] = useState(read);
  useEffect(() => {
    const onConsent = () => setAnswered(true);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);
  return answered;
}

// Post de tecnologia convida, uma vez só, para ler o blog no Terminal. Faixa fixa
// no rodapé (não empurra o texto); a resposta fica salva e o botão de estilo do
// topo troca de volta a qualquer hora.
export default function TerminalOffer({ category }) {
  const skin = useSkin();
  const answer = useOfferAnswer();
  const consentAnswered = useConsentAnswered();
  const features = useFeatures();

  // Desligado no painel: o convite (ou os estilos inteiros) não aparece
  if (!features.skins || !features.terminalOffer) return null;
  if (category !== TERMINAL_CATEGORY || skin === "terminal" || answer !== null || !consentAnswered) return null;

  const reply = (accept) => {
    answerOffer(accept);
    trackEvent("terminal_offer", { answer: accept ? "sim" : "nao", from: skin });
  };

  return (
    <aside
      aria-label="Convite para o modo terminal"
      className="skin-offer fixed bottom-0 inset-x-0 z-40 bg-[#0a0f0a] text-[#6dff8a] border-t border-[#4cc768] font-mono"
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        <p className="flex-1 leading-relaxed">
          &gt; Este post é de tecnologia. Quer ler o blog no modo terminal?
          <span className="block text-[#4cc768]">Dá para voltar a qualquer hora no ícone de estilo, no topo.</span>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => reply(true)}
            className="min-h-11 px-3 bg-[#6dff8a] text-[#0a0f0a] font-semibold hover:bg-[#9dffb0] transition"
          >
            [S] Sim, entrar
          </button>
          <button
            type="button"
            onClick={() => reply(false)}
            className="min-h-11 px-3 border border-[#6dff8a] hover:bg-[#111a11] transition"
          >
            [N] Agora não
          </button>
        </div>
      </div>
    </aside>
  );
}
