import { redirect } from "next/navigation";

/**
 * Rota de atalho da sidebar (`Workspace > Times`).
 *
 * Aponta para a pagina canonica de gestao de times. Mantida como rota
 * propria para permitir links/breadcrumbs limpos a partir da sidebar
 * sem expor o caminho de settings ao usuario final.
 */
export default function TeamsRedirectPage() {
  redirect("/settings/workspace/teams");
}
