import { useEffect, useMemo, useState } from "react";
import ExperimentsService from "../services/experiments.service";
import { CONSENT_EVENT, analyticsAllowed, trackEvent } from "../utils/analytics";

// Sorteio de variante de texto no site (Sprint R5).
//
// Regras:
// - Sem consentimento ("cookiesAccepted" diferente de "all"): devolve o texto padrão e NÃO grava
//   nada no navegador nem envia evento. O sorteio só acontece depois do "Aceitar".
// - Com consentimento: sorteia uma variante e guarda em localStorage por chave de experimento
//   (o visitante vê sempre a mesma). A escolha vale só enquanto a chave existir na lista ativa.
// - Se o visitante revogar o consentimento, volta ao texto padrão e as escolhas guardadas são
//   APAGADAS (decisão: revogar apaga o que foi gravado com base no consentimento; se aceitar de novo,
//   há um novo sorteio).
// - O experimento nunca bloqueia a renderização: enquanto a lista não chega, ou se a API falhar,
//   vale o texto padrão do componente.
//
// GA4 (o responsável precisa registrar uma vez, em Administrador > Definições personalizadas >
// Dimensões personalizadas > Criar, escopo "Evento"): `experiment_id` e `variant_id`.
// Eventos: `experiment_impression` { experiment_id, variant_id } (1x por página e experimento) e os
// mesmos dois parâmetros no evento de clique do espaço.

const PREFIXO = "exp:";
export const storageKey = (chave) => `${PREFIXO}${chave}`;

const lerEscolha = (chave) => {
  try {
    return localStorage.getItem(storageKey(chave));
  } catch {
    return null;
  }
};

const gravarEscolha = (chave, variante) => {
  try {
    localStorage.setItem(storageKey(chave), variante);
  } catch {
    /* sem localStorage: o sorteio vale só nesta visita */
  }
};

const sortear = (variantes) => variantes[Math.floor(Math.random() * variantes.length)];

/** Apaga todas as escolhas guardadas (revogação do consentimento) */
export function limparEscolhas() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIXO))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignora */
  }
}

// Impressões já enviadas nesta página (zera ao trocar de rota ou ao revogar)
let impressoes = new Set();
let impressoesPath = null;

function jaContou(chave) {
  const path = window.location.pathname;
  if (path !== impressoesPath) {
    impressoes = new Set();
    impressoesPath = path;
  }
  if (impressoes.has(chave)) return true;
  impressoes.add(chave);
  return false;
}

const SEM_VARIANTE = { variante: null, texto: null, params: {} };

/**
 * Variante sorteada para o espaço `alvo`.
 * Devolve { variante, texto, params }: `texto` é null quando o componente deve usar o padrão;
 * `params` ({ experiment_id, variant_id }) vai junto do evento de clique do espaço.
 */
export default function useExperiment(alvo) {
  const [lista, setLista] = useState(null);
  const [consent, setConsent] = useState(() => analyticsAllowed());

  useEffect(() => {
    let cancelled = false;
    ExperimentsService.getAtivos()
      .then((data) => { if (!cancelled) setLista(data); })
      .catch(() => {}); // falhou: fica o texto padrão
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onConsent = () => {
      const allowed = analyticsAllowed();
      if (!allowed) {
        limparEscolhas();
        impressoes = new Set();
      }
      setConsent(allowed);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const experimento = lista?.find((e) => e.alvo === alvo) || null;
  const chave = experimento?.chave || null;

  // Sorteio: só com consentimento. Vale a escolha guardada (se ainda existir); senão sorteia agora
  // e o efeito abaixo grava. Sem consentimento ou sem experimento: null = texto padrão.
  const ativa = useMemo(() => {
    if (!consent || !experimento || experimento.variantes.length < 2) return null;
    const guardada = lerEscolha(experimento.chave);
    return (
      experimento.variantes.find((v) => v.chave === guardada) ||
      sortear(experimento.variantes)
    );
  }, [consent, experimento]);

  // Gravação da escolha (só existe `ativa` com consentimento)
  useEffect(() => {
    if (ativa && chave && lerEscolha(chave) !== ativa.chave) gravarEscolha(chave, ativa.chave);
  }, [ativa, chave]);
  // Impressão: uma por página e experimento, só com consentimento e variante em tela
  const varianteChave = ativa?.chave;
  useEffect(() => {
    if (!varianteChave || !chave || !analyticsAllowed()) return;
    if (jaContou(chave)) return;
    trackEvent("experiment_impression", { experiment_id: chave, variant_id: varianteChave });
  }, [chave, varianteChave]);

  if (!ativa) return SEM_VARIANTE;
  return { variante: ativa.chave, texto: ativa.texto, params: { experiment_id: chave, variant_id: ativa.chave } };
}
