import { useEffect, useState } from "react";
import SuggestionsService from "../services/suggestions.service";

// Selo de sugestões novas na sidebar. A tela de Sugestões avisa quando o
// número muda (marcou como vista, arquivou), sem esperar a próxima navegação.
const EVENT = "new-suggestions-change";

export function notifyNewSuggestionsChanged(count) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: count }));
}

export function useNewSuggestions() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    SuggestionsService.newCount()
      .then((n) => active && setCount(n))
      .catch(() => {});
    const onChange = (e) => setCount(Number(e.detail) || 0);
    window.addEventListener(EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  return count;
}
