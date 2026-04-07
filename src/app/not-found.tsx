import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Pagina nao encontrada
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        A pagina que voce procura nao existe ou foi movida.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Voltar ao inicio</Link>
      </Button>
    </div>
  );
}
