import { useSyncExternalStore } from "react";
import api from "../services/api";

// Recursos do blog que o painel liga e desliga (Recursos do blog, backend
// app/config/features.js). Padrão = ligado: sem resposta da API o leitor vê tudo.
// A última resposta fica no navegador: o public/theme-init.js lê antes de pintar
// (estilo desligado não pisca) e a próxima visita já abre certa.
export const FEATURE_DEFAULTS = {
  skins: true,
  terminalOffer: true,
  toc: true,
  readingProgress: true,
};

const KEY = "site-features";
export const FEATURES_EVENT = "features-change";

let memory = null; // sem localStorage: vale só nesta visita
let snapshot = { raw: undefined, value: FEATURE_DEFAULTS };

function readRaw() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}

// Só os nomes conhecidos e só true/false; o resto fica no padrão
function normalize(features) {
  const out = { ...FEATURE_DEFAULTS };
  for (const name of Object.keys(FEATURE_DEFAULTS)) {
    if (typeof features?.[name] === "boolean") out[name] = features[name];
  }
  return out;
}

// Mesmo objeto enquanto nada muda (useSyncExternalStore compara por referência)
export function getFeatures() {
  const raw = readRaw();
  if (raw !== snapshot.raw) {
    let parsed = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      /* valor estragado: padrão */
    }
    snapshot = { raw, value: normalize(parsed) };
  }
  return snapshot.value;
}

export const isFeatureOn = (name) => getFeatures()[name] !== false;

export function saveFeatures(features) {
  const raw = JSON.stringify(normalize(features));
  if (raw === readRaw()) return;
  memory = raw;
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    /* sem localStorage: fica na memória */
  }
  window.dispatchEvent(new Event(FEATURES_EVENT));
}

// Uma busca por carregamento da página (o blog chama ao montar o layout)
let loading = null;
export function loadFeatures() {
  if (!loading) {
    loading = api
      .get("/settings/features", { cacheable: true })
      .then(({ data }) => saveFeatures(data?.features))
      .catch(() => {
        /* API fora: fica a última resposta (ou o padrão) */
      });
  }
  return loading;
}

function subscribe(onChange) {
  window.addEventListener(FEATURES_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(FEATURES_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const useFeatures = () => useSyncExternalStore(subscribe, getFeatures, () => FEATURE_DEFAULTS);
