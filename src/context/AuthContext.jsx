import { createContext, useCallback, useEffect, useRef, useState } from "react";
import AuthService from "../services/auth.service";

export const AuthContext = createContext();

// O token da sessão fica num cookie httpOnly (o JavaScript não o lê).
// Aqui guardamos só um indicador para exibição (nome/email), sem valor de acesso:
// quem decide se a sessão vale é a API (GET /auth/me).
const USER_HINT = "user";

function readHint() {
  try {
    const raw = localStorage.getItem(USER_HINT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeHint(user) {
  try {
    if (user) localStorage.setItem(USER_HINT, JSON.stringify(user));
    else localStorage.removeItem(USER_HINT);
  } catch {
    /* sem localStorage */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readHint);
  // unknown = ainda não conferiu | authenticated | anonymous
  const [status, setStatus] = useState("unknown");
  const pending = useRef(null);

  // Remove o token antigo do localStorage (antes da sessão por cookie)
  useEffect(() => {
    try {
      localStorage.removeItem("token");
    } catch {
      /* sem localStorage */
    }
  }, []);

  // Confere a sessão na API uma vez por carregamento (chamado pelas telas do admin)
  const ensureSession = useCallback(() => {
    if (!pending.current) {
      pending.current = AuthService.me()
        .then(({ user: me }) => {
          setUser(me);
          writeHint(me);
          setStatus("authenticated");
          return true;
        })
        .catch(() => {
          setUser(null);
          writeHint(null);
          setStatus("anonymous");
          pending.current = null; // próxima tentativa confere de novo
          return false;
        });
    }
    return pending.current;
  }, []);

  const login = (loggedUser) => {
    setUser(loggedUser);
    writeHint(loggedUser);
    setStatus("authenticated");
    pending.current = Promise.resolve(true);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {
      /* sai mesmo assim; o cookie expira em 7 dias */
    }
    writeHint(null);
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout, ensureSession }}>
      {children}
    </AuthContext.Provider>
  );
}
