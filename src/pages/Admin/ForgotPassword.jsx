import { useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../services/auth.service";
import SEO from "../../components/SEO";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await AuthService.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Não foi possível enviar o email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <div className="max-w-sm mx-auto mt-20">
        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-xl font-bold">Verifique seu email</h1>
            <p className="text-sm text-gray-500">
              Se o email informado existir, enviamos um link para redefinir a
              senha. O link expira em 1 hora.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold text-center">Esqueci a senha</h1>
            <p className="text-sm text-gray-500 text-center">
              Informe seu email para receber um link de redefinição de senha.
            </p>

            {error && (
              <span className="text-red-500 text-sm text-center">
                {error}
              </span>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded"
              required
            />

            <button
              disabled={loading}
              className="bg-black text-white p-2 rounded disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

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
