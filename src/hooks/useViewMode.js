import { useState } from "react";

// Formato de visualização escolhido pelo usuário, lembrado neste navegador.
// Sem localStorage (aba privada, bloqueio) funciona só durante a visita.
export default function useViewMode(storageKey, modes, fallback) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return modes.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  const change = (next) => {
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* segue sem lembrar */
    }
  };

  return [mode, change];
}
