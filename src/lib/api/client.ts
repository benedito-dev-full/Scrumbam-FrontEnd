import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: injeta Authorization: Bearer <accessToken>
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url || "";
  // Endpoints publicos (login/register) nao precisam de Authorization
  const isPublicAuthRoute =
    url.includes("/auth/login") || url.includes("/auth/register");

  if (!isPublicAuthRoute) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

// Response interceptor: refresh token on 401, then retry
// Se refresh falha, desloga o usuario
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(undefined);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    // 403 NO_WORKSPACE (ADR-V2-038): JWT é válido mas usuário não tem
    // workspace ativa. NÃO faz logout — JWT órfão continua válido.
    // Redireciona para /orphan (tela de empty state com CTAs).
    if (
      error.response?.status === 403 &&
      (error.response?.data as { code?: string } | undefined)?.code ===
        "NO_WORKSPACE"
    ) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/orphan")
      ) {
        window.location.href = "/orphan";
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Se ja esta refreshing, enfileirar request e esperar
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{
          accessToken: string;
          refreshToken: string;
        }>("/auth/refresh", { refreshToken });

        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

        processQueue(null);
        return api(originalRequest); // retry com novo token (request interceptor injeta)
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          toast.warning("Sessão expirada. Faça login novamente.", {
            duration: 6000,
          });
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
