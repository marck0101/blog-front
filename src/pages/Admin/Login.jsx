import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Smartphone, KeyRound, Copy, Download } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import AuthService from "../../services/auth.service";
import SEO from "../../components/SEO";

// Erros que a API manda na volta do Google (?error=…)
const GOOGLE_ERRORS = {
  "google-config": "O login com Google ainda não foi configurado no servidor. Use a senha (reserva).",
  "google-denied": "Login com Google cancelado.",
  "google-account": "Essa conta Google não tem acesso ao painel.",
  "google-failed": "Não foi possível entrar com o Google. Tente de novo.",
};

// 429 = muitas tentativas; 5xx = falha do servidor (não é "código incorreto")
function apiError(err, fallback) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message;
  if (status === 429) return message || "Muitas tentativas. Tente novamente mais tarde.";
  if (!status || status >= 500) return message || "Erro no servidor. Tente de novo em instantes.";
  return message || fallback;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

// Campo do código de 6 dígitos (o celular sugere o código de SMS/app quando dá)
function CodeInput({ value, onChange, recovery = false }) {
  return (
    <input
      name="code"
      autoFocus
      autoComplete={recovery ? "off" : "one-time-code"}
      inputMode={recovery ? "text" : "numeric"}
      maxLength={recovery ? 12 : 6}
      placeholder={recovery ? "xxxx-xxxx" : "000000"}
      value={value}
      onChange={(e) => onChange(recovery ? e.target.value : e.target.value.replace(/\D/g, ""))}
      className="input text-center text-2xl tracking-[0.4em] font-mono"
      aria-label={recovery ? "Código de recuperação" : "Código de 6 dígitos do app autenticador"}
    />
  );
}

/** Mostra os códigos de recuperação uma única vez, com copiar e baixar */
export function RecoveryCodes({ codes }) {
  const [copied, setCopied] = useState(false);
  const text = `Códigos de recuperação — painel marck0101\nCada código vale uma vez.\n\n${codes.join("\n")}\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* sem permissão de área de transferência */
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigos-recuperacao-marck0101.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        {codes.map((c) => <li key={c} className="text-center">{c}</li>)}
      </ul>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={copy} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm">
          <Copy size={14} /> {copied ? "Copiados" : "Copiar"}
        </button>
        <button type="button" onClick={download} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm">
          <Download size={14} /> Baixar .txt
        </button>
      </div>
    </div>
  );
}

/**
 * Login do painel:
 *   start    → Google (principal) ou senha (reserva)
 *   setup    → 1º acesso: cadastrar o app autenticador (QR) e confirmar um código
 *   codes    → mostrar os códigos de recuperação (uma vez)
 *   verify   → código do app (ou de recuperação)
 */
export default function Login() {
  const { user, login, ensureSession } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [step, setStep] = useState(() => {
    const s = searchParams.get("step");
    return s === "verify" || s === "setup" ? s : "start";
  });
  const [error, setError] = useState(() => GOOGLE_ERRORS[searchParams.get("error")] || "");
  const [busy, setBusy] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pendingInfo, setPendingInfo] = useState(null); // { method, email }
  const [setupData, setSetupData] = useState(null); // { qr, secret }
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [savedCodes, setSavedCodes] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);

  // Tira ?step/?error da URL (não ficam no histórico nem num recarregar)
  useEffect(() => {
    if (searchParams.has("step") || searchParams.has("error")) setSearchParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Já tem sessão válida? Vai direto para o painel (só confere se há indício)
  useEffect(() => {
    if (!user || step !== "start") return;
    ensureSession().then((ok) => ok && navigate("/admin", { replace: true }));
  }, [user, step, ensureSession, navigate]);

  // Etapa 2: confere se a etapa 1 ainda vale; no 1º acesso, já gera o QR
  useEffect(() => {
    if (step !== "verify" && step !== "setup") return;
    let alive = true;
    AuthService.pending()
      .then(async (info) => {
        if (!alive) return;
        setPendingInfo(info);
        if (!info.enrolled) {
          setStep("setup");
          const data = await AuthService.setup();
          if (alive) setSetupData(data);
        } else {
          setStep("verify");
        }
      })
      .catch(() => {
        if (!alive) return;
        setStep("start");
        setError("A etapa de login expirou. Entre de novo.");
      });
    return () => {
      alive = false;
    };
  }, [step === "start"]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePassword(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { next } = await AuthService.login(email, password);
      setPassword("");
      setStep(next);
    } catch (err) {
      setError(err?.response?.status === 429 ? apiError(err) : "Credenciais inválidas");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnable(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await AuthService.enable(code);
      setLoggedUser(data.user);
      setRecoveryCodes(data.recoveryCodes);
      setStep("codes");
    } catch (err) {
      setError(apiError(err, "Código incorreto"));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await AuthService.verify(code);
      login(data.user);
      // Usou um código de recuperação: mostra quantos restam e como gerar novos
      navigate(data.recoveryCodesLeft !== undefined ? "/admin/security" : "/admin", { replace: true });
    } catch (err) {
      setError(apiError(err, "Código incorreto"));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  const finishSetup = () => {
    login(loggedUser);
    navigate("/admin", { replace: true });
  };

  const card = "w-full max-w-sm rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5";
  const primaryBtn = "w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-medium disabled:opacity-50";

  return (
    <>
      <SEO robots="noindex, nofollow" />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-gray-900 dark:text-gray-100">
        <div className={card}>
          <div className="text-center">
            <ShieldCheck className="mx-auto text-blue-600" size={32} />
            <h1 className="text-xl font-bold mt-2">Painel marck0101</h1>
          </div>

          {error && (
            <p role="alert" className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* ETAPA 1 */}
          {step === "start" && (
            <>
              <a
                href={AuthService.googleLoginUrl()}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <GoogleIcon /> Entrar com Google
              </a>
              <p className="text-xs text-center text-gray-500 dark:text-gray-300">
                Depois do Google, o painel pede o código do app autenticador.
              </p>

              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full text-sm text-gray-500 dark:text-gray-300 hover:underline"
                >
                  Entrar com email e senha (reserva)
                </button>
              ) : (
                <form onSubmit={handlePassword} className="space-y-3 pt-3 border-t">
                  <input name="email" autoComplete="username" type="email"
                    placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input" />
                  <div className="relative">
                    <input name="password" autoComplete="current-password"
                      type={showPassword ? "text" : "password"} placeholder="Senha"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button className={primaryBtn} disabled={busy}>{busy ? "Entrando..." : "Continuar"}</button>
                  <Link to="/admin/forgot-password" className="block text-sm text-center text-gray-500 hover:underline">
                    Esqueci a senha
                  </Link>
                </form>
              )}
            </>
          )}

          {/* 1º ACESSO: CADASTRAR O APP */}
          {step === "setup" && (
            <form onSubmit={handleEnable} className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Smartphone size={18} className="shrink-0 mt-0.5" />
                <p>
                  Primeiro acesso{pendingInfo?.email ? ` de ${pendingInfo.email}` : ""}: abra o Google Authenticator
                  (ou Authy, 1Password…), toque em <strong>+</strong> e escaneie o QR code.
                </p>
              </div>
              {setupData ? (
                <>
                  <img src={setupData.qr} alt="QR code para o app autenticador" width={220} height={220}
                    className="mx-auto rounded-lg bg-white p-2" />
                  <details className="text-xs text-gray-500 dark:text-gray-300">
                    <summary className="cursor-pointer">Não consegue escanear? Digite a chave</summary>
                    <p className="mt-2 font-mono text-sm break-all select-all text-gray-800 dark:text-gray-100">{setupData.secret}</p>
                  </details>
                </>
              ) : (
                <div className="mx-auto w-[220px] h-[220px] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              )}
              <label className="block text-sm font-medium">Código de 6 dígitos que aparece no app</label>
              <CodeInput value={code} onChange={setCode} />
              <button className={primaryBtn} disabled={busy || code.length !== 6}>
                {busy ? "Conferindo..." : "Ativar e entrar"}
              </button>
            </form>
          )}

          {/* CÓDIGOS DE RECUPERAÇÃO (uma vez) */}
          {step === "codes" && recoveryCodes && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <KeyRound size={18} className="shrink-0 mt-0.5 text-amber-600" />
                <p>
                  <strong>Guarde estes códigos</strong> num lugar seguro (gerenciador de senhas ou impresso).
                  Se perder o celular, cada um permite entrar uma vez. Eles não aparecem de novo.
                </p>
              </div>
              <RecoveryCodes codes={recoveryCodes} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={savedCodes} onChange={(e) => setSavedCodes(e.target.checked)} className="accent-blue-600" />
                Guardei os códigos
              </label>
              <button type="button" onClick={finishSetup} disabled={!savedCodes} className={primaryBtn}>
                Ir para o painel
              </button>
            </div>
          )}

          {/* LOGIN NORMAL: CÓDIGO DO APP */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                {useRecovery
                  ? "Digite um dos seus códigos de recuperação."
                  : "Digite o código de 6 dígitos do app autenticador."}
              </p>
              <CodeInput value={code} onChange={setCode} recovery={useRecovery} />
              <button className={primaryBtn} disabled={busy || (!useRecovery && code.length !== 6) || !code}>
                {busy ? "Conferindo..." : "Entrar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRecovery(!useRecovery);
                  setCode("");
                  setError("");
                }}
                className="w-full text-sm text-gray-500 dark:text-gray-300 hover:underline"
              >
                {useRecovery ? "Usar o app autenticador" : "Perdi o celular: usar código de recuperação"}
              </button>
            </form>
          )}
        </div>

        <Link to="/blog" className="mt-6 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
          ← Voltar ao blog
        </Link>
      </main>
    </>
  );
}
