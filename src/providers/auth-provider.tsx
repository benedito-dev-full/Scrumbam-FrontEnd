"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isHydrated, setIsHydrated] = useState(false);

  // Aguardar hydration do Zustand persist (localStorage -> state)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Nao tomar decisao antes de hydratar

    const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!accessToken && !isPublicPath) {
      router.replace("/login");
    }

    if (accessToken && isPublicPath) {
      router.replace("/intentions");
    }
  }, [accessToken, pathname, router, isHydrated]);

  // Enquanto nao hydratou, nao renderiza nada (evita flash de redirect)
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
