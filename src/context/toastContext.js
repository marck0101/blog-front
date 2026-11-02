import { createContext } from "react";

// showToast(mensagem, tipo = "success" | "error", ação = { label, onClick }) — ver ToastProvider
export const ToastContext = createContext(null);
