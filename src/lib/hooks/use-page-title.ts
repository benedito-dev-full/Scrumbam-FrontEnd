import { useEffect } from "react";

const BASE_TITLE = "Scrumban";

export function usePageTitle(subtitle?: string) {
  useEffect(() => {
    document.title = subtitle ? `${BASE_TITLE} | ${subtitle}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [subtitle]);
}
