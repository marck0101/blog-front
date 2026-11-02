import { useContext } from "react";
import { ToastContext } from "../context/toastContext";

/**
 * Aviso de resultado (salvou, excluiu, erro…), o mesmo em todas as telas.
 *   const showToast = useToast();
 *   showToast("Post salvo");
 *   showToast("Erro ao salvar", "error");
 *   showToast("Movido", "success", { label: "Desfazer", onClick: desfazer });
 */
export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error("useToast precisa estar dentro do <ToastProvider>");
  return showToast;
}
