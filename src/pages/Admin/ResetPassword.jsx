import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthService from "../../services/auth.service";
import SEO from "../../components/SEO";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      await AuthService.resetPassword(token, password);
      navigate("/admin/login");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Não foi possível redefinir a senha"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-20 flex flex-col gap-4 text-center">
        <h1 className="text-xl font-bold">Link inválido</h1>
        <p className="text-sm text-gray-500">
          O link de redefinição está incompleto ou inválido.
        </p>
        <Link to="/admin/forgot-password" className="text-sm underline">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <div className="max-w-sm mx-auto mt-20">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-center">Nova senha</h1>

          {error && (
            <span className="text-red-500 text-sm text-center">{error}</span>
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded w-full pr-10"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <button
            disabled={loading}
            className="bg-black text-white p-2 rounded disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <Link
          to="/admin/login"
          className="mt-6 block text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          ← Voltar ao login
        </Link>
      </div>
    </>
  );
}
