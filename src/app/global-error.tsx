"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-950 font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="text-7xl font-bold text-red-500">500</p>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-100">
            Algo deu errado
          </h1>
          <p className="mt-2 max-w-md text-neutral-400">
            Ocorreu um erro inesperado. Tente novamente.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-neutral-600">
              Codigo: {error.digest}
            </p>
          )}
          <div className="mt-8 flex gap-3">
            <button
              onClick={reset}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Voltar ao inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
