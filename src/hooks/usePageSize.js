import { useState } from "react";

// Itens por página escolhidos pelo usuário, lembrados neste navegador (por tela)
export default function usePageSize(storageKey, options, fallback) {
  const [size, setSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      return options.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  const change = (next) => {
    setSize(next);
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      /* segue sem lembrar */
    }
  };

  return [size, change];
}
