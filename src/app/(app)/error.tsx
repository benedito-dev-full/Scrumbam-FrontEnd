"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-bold text-destructive">500</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Algo deu errado nesta pagina
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Voce pode tentar novamente ou voltar para
        as intencoes.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Codigo: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/intentions">Voltar para Intencoes</Link>
        </Button>
      </div>
    </div>
  );
}
