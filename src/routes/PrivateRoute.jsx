import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Telas do admin: confere a sessão (cookie httpOnly) na API antes de mostrar
export default function PrivateRoute({ children }) {
  const { status, ensureSession } = useContext(AuthContext);

  useEffect(() => {
    if (status === "unknown") ensureSession();
  }, [status, ensureSession]);

  if (status === "anonymous") return <Navigate to="/admin/login" replace />;
  if (status === "unknown") return <div className="min-h-screen" aria-busy="true" />;
  return children;
}
