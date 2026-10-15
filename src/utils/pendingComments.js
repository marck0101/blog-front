import { useEffect, useState } from "react";
import CommentsService from "../services/comments.service";

// Selo de comentários pendentes na sidebar. A tela de Comentários avisa
// quando o número muda (aprovou, recusou), sem esperar a próxima navegação.
const EVENT = "pending-comments-change";

export function notifyPendingCommentsChanged(count) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: count }));
}

export function usePendingComments() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    CommentsService.pendingCount()
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
