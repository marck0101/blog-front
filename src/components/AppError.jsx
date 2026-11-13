import { useRouteError } from "react-router-dom";
import { AlertTriangle, RotateCw } from "lucide-react";

// Tela de erro do app (errorElement da rota raiz). Sem stack trace nem mensagem
// técnica para o visitante: a tela padrão do React Router mostrava os dois. O
// detalhe fica no console, para quem estiver depurando.
export default function AppError() {
  const error = useRouteError();
  console.error("[app] erro na página:", error);
  const inPanel = window.location.pathname.startsWith("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-md text-center space-y-4">
        <AlertTriangle size={40} className="mx-auto text-amber-500" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Algo deu errado nesta página</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Tente carregar de novo. Se continuar, volte ao início.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <RotateCw size={16} aria-hidden="true" /> Carregar de novo
          </button>
          <a
            href={inPanel ? "/admin" : "/blog"}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {inPanel ? "Voltar ao painel" : "Voltar ao blog"}
          </a>
        </div>
      </div>
    </main>
  );
}
