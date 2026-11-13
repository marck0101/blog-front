import { useSyncExternalStore } from "react";
import { FEATURES_EVENT, isFeatureOn } from "./features";
import { applyTheme } from "./theme";

// Estilo do blog: "atual" | "jornal" | "terminal". Fiéis à época: o Jornal é
// sempre papel claro e o Terminal sempre escuro; o tema claro/escuro só vale no
// visual atual (e volta como estava quando o leitor sai da época).
// Mesma regra de public/theme-init.js, que aplica antes de pintar.
const KEY = "skin";
const OFFER_KEY = "skin-offer";
const EVENT = "skin-change";
export const SKINS = ["atual", "jornal", "terminal"];
export const SKIN_CSS_ID = "skin-raiz";
export const SKIN_CSS_HREF = "/skins/raiz.css";
// Post desta categoria convida para o Terminal (uma vez só)
export const TERMINAL_CATEGORY = "tecnologia";

// Desligado no painel (Recursos do blog): todo mundo no visual atual. A escolha
// do leitor continua salva e volta quando o recurso for religado.
export function getSkin() {
  if (!isFeatureOn("skins")) return "atual";
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* sem localStorage: visual atual */
  }
  if (saved === "raiz") return "jornal"; // fase 1 guardava "raiz"
  return saved === "jornal" || saved === "terminal" ? saved : "atual";
}

// O CSS só é baixado por quem escolhe um estilo; quem nunca escolhe não paga nada
export function loadSkinCss() {
  if (document.getElementById(SKIN_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = SKIN_CSS_ID;
  link.rel = "stylesheet";
  link.href = SKIN_CSS_HREF;
  document.head.appendChild(link);
}

// "raiz" = qualquer estilo de época (base comum do CSS); "jornal"/"terminal" = qual
export function applySkin(skin = getSkin()) {
  const on = skin !== "atual";
  if (on) loadSkinCss();
  const classes = document.documentElement.classList;
  classes.toggle("raiz", on);
  classes.toggle("jornal", skin === "jornal");
  classes.toggle("terminal", skin === "terminal");
  applyTheme(); // tira ou devolve a classe "dark" conforme a época
  return skin;
}

export function setSkin(skin) {
  const next = SKINS.includes(skin) ? skin : "atual";
  try {
    if (next === "atual") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* sem localStorage: vale só nesta visita */
  }
  applySkin(next);
  window.dispatchEvent(new Event(EVENT));
  return next;
}

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener(FEATURES_EVENT, onChange);
  window.addEventListener("storage", onChange); // outra aba mudou
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener(FEATURES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Painel ligou/desligou os estilos: a página aberta troca na hora (no painel
// em si não há estilo de época)
if (typeof window !== "undefined") {
  window.addEventListener(FEATURES_EVENT, () => {
    applySkin(window.location.pathname.startsWith("/admin") ? "atual" : getSkin());
  });
}

// Estilo atual, igual em todos os componentes (botão do topo, convite do post)
export const useSkin = () => useSyncExternalStore(subscribe, getSkin, () => "atual");

// Convite do Terminal: null = ainda não respondeu
export function getOfferAnswer() {
  try {
    return localStorage.getItem(OFFER_KEY);
  } catch {
    return "sem-armazenamento"; // não dá para lembrar a resposta: não pergunta
  }
}

export function answerOffer(accept) {
  try {
    localStorage.setItem(OFFER_KEY, accept ? "aceito" : "recusado");
  } catch {
    /* sem localStorage: vale só nesta visita */
  }
  if (accept) setSkin("terminal");
  else window.dispatchEvent(new Event(EVENT));
}

export const useOfferAnswer = () => useSyncExternalStore(subscribe, getOfferAnswer, () => "ssr");
