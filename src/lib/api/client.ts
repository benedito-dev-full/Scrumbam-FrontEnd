import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Envia cookies httpOnly automaticamente
});

// Response interceptor: logout on 401 (no refresh token support)
// Ignora rotas de auth (login/register) — 401 ali e esperado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && !error.config._retry && !isAuthRoute) {
      error.config._retry = true;
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        toast.warning("Sessão expirada. Faça login novamente.", {
          duration: 6000,
        });
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
