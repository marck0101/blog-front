import { createContext } from "react";

// Sessão do admin no painel: { user, status, login, logout… } — ver components/AuthProvider
export const AuthContext = createContext();
