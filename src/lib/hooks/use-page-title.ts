import { useEffect } from "react";

const BASE_TITLE = "Scrumban";

/**
 * Atualiza document.title enquanto o componente esta montado.
 *
 * - `subtitle: string`  → `"Scrumban | <subtitle>"`
 * - `subtitle: undefined` → `"Scrumban"` (reset puro)
 * - `subtitle: null`    → no-op (NAO mexe no titulo). Util quando o componente
 *                          esta dentro de um modal e ja existe outro caller
 *                          mais externo dirigindo o titulo da pagina.
 */
export function usePageTitle(subtitle?: string | null) {
  useEffect(() => {
    if (subtitle === null) return;
    document.title = subtitle ? `${BASE_TITLE} | ${subtitle}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [subtitle]);
}
