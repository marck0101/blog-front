import { createContext } from "react";

// Sessão do painel (usuário, login, logout). O provider fica em AuthContext.jsx;
// separado para o fast refresh do Vite funcionar (arquivo de componente só
// exporta componente).
export const AuthContext = createContext();
