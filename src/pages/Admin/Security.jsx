import { useContext, useEffect, useState } from "react";
import { ShieldCheck, KeyRound, LogOut, CheckCircle2, AlertTriangle } from "lucide-react";
import Header from "../../components/Header";
import SEO from "../../components/SEO";
import { AuthContext } from "../../context/AuthContext";
import AuthService from "../../services/auth.service";
import { RecoveryCodes } from "./Login";

const LOW_CODES = 3;

// Status do login: Google, app autenticador, códigos de recuperação e sessões
export default function Security() {
  const { logout } = useContext(AuthContext);
  const [security, setSecurity] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newCodes, setNewCodes] = useState(null);

  useEffect(() => {
    AuthService.me().then((d) => setSecurity(d.security)).catch(() => {});
  }, []);

  const regenerate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const codes = await AuthService.regenerateRecoveryCodes(code);
      setNewCodes(codes);
      setSecurity((s) => ({ ...s, recoveryCodesLeft: codes.length }));
      setCode("");
    } catch (err) {
      setError(err?.response?.data?.message || "Código incorreto");
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ ok, title, children }) => (
    <div className="flex items-start gap-3 py-4 border-b last:border-b-0">
      {ok ? (
        <CheckCircle2 size={20} className="shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <AlertTriangle size={20} className="shrink-0 text-amber-500" />
      )}
      <div className="text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <div className="text-gray-500 dark:text-gray-300 mt-0.5">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <Header />
      <main className="admin-content max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck size={22} /> Segurança</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            O painel exige duas etapas: Google (ou senha, reserva) e o código do app autenticador.
          </p>
        </div>

        {security && (
          <section className="rounded-xl border bg-white dark:bg-gray-900 px-5 max-w-2xl">
            <Row ok={security.googleConfigured && security.googleLinked} title="Login com Google">
              {!security.googleConfigured
                ? "Ainda não configurado no servidor (faltam GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI). Por enquanto, entre com a senha."
                : security.googleLinked
                ? "Conta Google vinculada. Só ela entra pelo Google."
                : "Configurado. A conta é vinculada no primeiro login com Google."}
            </Row>
            <Row ok={Boolean(security.mfaEnabledAt)} title="App autenticador">
              {security.mfaEnabledAt
                ? `Ativo desde ${new Date(security.mfaEnabledAt).toLocaleDateString("pt-BR")}.`
                : "Não configurado."}
            </Row>
            <Row ok={security.recoveryCodesLeft > LOW_CODES} title="Códigos de recuperação">
              {security.recoveryCodesLeft} restante(s).{" "}
              {security.recoveryCodesLeft <= LOW_CODES && "Gere novos abaixo antes que acabem."}
            </Row>
          </section>
        )}

        <section className="rounded-xl border bg-white dark:bg-gray-900 p-5 max-w-2xl space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound size={18} /> Gerar novos códigos de recuperação</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">Os códigos antigos deixam de valer.</p>
          {newCodes ? (
            <>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Guarde agora: eles não aparecem de novo.</p>
              <RecoveryCodes codes={newCodes} />
            </>
          ) : (
            <form onSubmit={regenerate} className="flex flex-wrap items-center gap-2">
              <input
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="Código do app"
                aria-label="Código de 6 dígitos do app autenticador"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="input !w-40 font-mono text-center tracking-widest"
              />
              <button disabled={busy || code.length !== 6} className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium disabled:opacity-50">
                {busy ? "Gerando..." : "Gerar novos códigos"}
              </button>
              {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
            </form>
          )}
        </section>

        <section className="rounded-xl border bg-white dark:bg-gray-900 p-5 max-w-2xl space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><LogOut size={18} /> Sessões</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Sair encerra o login em todos os aparelhos e navegadores ao mesmo tempo.
          </p>
          <button type="button" onClick={logout} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
            Sair de todos os aparelhos
          </button>
        </section>

        <p className="text-xs text-gray-400 max-w-2xl">
          Perdeu o celular e os códigos? Com acesso ao servidor: <code>node scripts/reset-2fa.js seu@email --prod</code> (no
          blog-backend). Pelo site não é possível pular o 2º fator.
        </p>
      </main>
    </>
  );
}
